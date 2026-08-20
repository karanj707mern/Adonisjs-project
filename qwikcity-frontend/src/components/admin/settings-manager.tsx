import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getStoreSettings, updateStoreSettings } from "~/lib/api/settings";
import { toast } from "~/lib/toast";

const EMPTY_SETTINGS_FORM = {
  shippingCharge: "99",
  expressShippingCharge: "149",
  sameDayShippingCharge: "249",
  codCharge: "25",
  handlingCharge: "20",
  taxRate: "0",
  freeShippingThreshold: "",
  shippingZones: JSON.stringify(
    [
      {
        key: "DOMESTIC",
        label: "India",
        countries: ["india"],
        allowedShippingTypes: ["standard", "express", "sameDay", "prime"],
        taxRate: null,
        shippingMultiplier: 1,
      },
      {
        key: "INTERNATIONAL",
        label: "Rest of world",
        countries: [],
        allowedShippingTypes: ["standard"],
        taxRate: 0,
        shippingMultiplier: 2,
      },
    ],
    null,
    2,
  ),
  codEnabled: true,
  maxCodOrderValue: "5000",
  allowInternationalCod: false,
  autoCancelPendingMinutes: "30",
};

function toSettingsFormState(settings: Record<string, unknown> = {}) {
  return {
    shippingCharge: String(settings.shippingCharge ?? 99),
    expressShippingCharge: String(settings.expressShippingCharge ?? 149),
    sameDayShippingCharge: String(settings.sameDayShippingCharge ?? 249),
    codCharge: String(settings.codCharge ?? 25),
    handlingCharge: String(settings.handlingCharge ?? 20),
    taxRate: String(settings.taxRate ?? 0),
    freeShippingThreshold:
      settings.freeShippingThreshold == null
        ? ""
        : String(settings.freeShippingThreshold),
    shippingZones: JSON.stringify(
      settings.shippingZones ?? JSON.parse(EMPTY_SETTINGS_FORM.shippingZones),
      null,
      2,
    ),
    codEnabled: Boolean(settings.codEnabled ?? true),
    maxCodOrderValue:
      settings.maxCodOrderValue == null
        ? ""
        : String(settings.maxCodOrderValue),
    allowInternationalCod: Boolean(settings.allowInternationalCod ?? false),
    autoCancelPendingMinutes: String(settings.autoCancelPendingMinutes ?? 30),
  };
}

export default component$(() => {
  const nav = useNavigate();
  const settingsForm = useStore({ ...EMPTY_SETTINGS_FORM });
  const loading = useSignal(true);
  const error = useSignal("");

  const loadSettings = $(async () => {
    try {
      const data = await getStoreSettings();
      Object.assign(
        settingsForm,
        toSettingsFormState((data as Record<string, unknown>) || {}),
      );
      error.value = "";
    } catch (err) {
      Object.assign(settingsForm, toSettingsFormState());
      error.value = (err as Error).message || "Could not load store settings.";
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadSettings();
  });

  const handleChange = $(
    (e: Event, currentTarget: HTMLInputElement | HTMLTextAreaElement) => {
      const target = currentTarget;
      const name = target.name as keyof typeof settingsForm;
      if (target.type === "checkbox") {
        (settingsForm as Record<string, unknown>)[name as string] = (
          target as HTMLInputElement
        ).checked;
      } else {
        (settingsForm as Record<string, unknown>)[name as string] =
          target.value;
      }
    },
  );

  const handleSubmit = $(async () => {
    error.value = "";
    let shippingZones: unknown;
    try {
      shippingZones = JSON.parse(settingsForm.shippingZones);
    } catch {
      error.value = "Shipping zones must be valid JSON.";
      return;
    }

    const payload = {
      shippingCharge: Number(settingsForm.shippingCharge),
      expressShippingCharge: Number(settingsForm.expressShippingCharge),
      sameDayShippingCharge: Number(settingsForm.sameDayShippingCharge),
      codCharge: Number(settingsForm.codCharge),
      handlingCharge: Number(settingsForm.handlingCharge),
      taxRate: Number(settingsForm.taxRate),
      freeShippingThreshold:
        settingsForm.freeShippingThreshold.trim() === ""
          ? undefined
          : Number(settingsForm.freeShippingThreshold),
      shippingZones,
      codEnabled: Boolean(settingsForm.codEnabled),
      maxCodOrderValue:
        settingsForm.maxCodOrderValue.trim() === ""
          ? undefined
          : Number(settingsForm.maxCodOrderValue),
      allowInternationalCod: Boolean(settingsForm.allowInternationalCod),
      autoCancelPendingMinutes: Number(settingsForm.autoCancelPendingMinutes),
    };

    try {
      await updateStoreSettings(payload);
      toast.success("Store settings updated successfully.");
      error.value = "";
    } catch (err) {
      error.value =
        (err as Error).message || "Could not update store settings.";
    }
  });

  return (
    <section class="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Store settings
          </p>
          <h2 class="mt-2 font-serif text-2xl text-slate-900 sm:text-3xl dark:text-slate-100">
            Shipping and tax rules
          </h2>
        </div>
      </div>

      {error.value && (
        <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error.value}
        </div>
      )}

      {loading.value ? (
        <div class="mt-8 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800">
          Loading settings…
        </div>
      ) : (
        <form
          preventdefault:submit
          onSubmit$={handleSubmit}
          class="mt-8 space-y-4"
        >
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Shipping charge
            <input
              name="shippingCharge"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.shippingCharge}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["shippingCharge"] =
                  el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Express shipping charge
            <input
              name="expressShippingCharge"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.expressShippingCharge}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)[
                  "expressShippingCharge"
                ] = el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Same day shipping charge
            <input
              name="sameDayShippingCharge"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.sameDayShippingCharge}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)[
                  "sameDayShippingCharge"
                ] = el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Cash on delivery charge
            <input
              name="codCharge"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.codCharge}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["codCharge"] =
                  el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Handling charge
            <input
              name="handlingCharge"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.handlingCharge}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["handlingCharge"] =
                  el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tax rate (%)
            <input
              name="taxRate"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.taxRate}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["taxRate"] =
                  el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Free shipping threshold
            <input
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.freeShippingThreshold}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)[
                  "freeShippingThreshold"
                ] = el.value)
              }
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settingsForm.codEnabled as boolean}
              onChange$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["codEnabled"] = (
                  el as HTMLInputElement
                ).checked)
              }
            />
            Enable cash on delivery
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Max COD order value
            <input
              name="maxCodOrderValue"
              type="number"
              min="0"
              step="0.01"
              value={settingsForm.maxCodOrderValue}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["maxCodOrderValue"] =
                  el.value)
              }
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settingsForm.allowInternationalCod as boolean}
              onChange$={(_, el) =>
                ((settingsForm as Record<string, unknown>)[
                  "allowInternationalCod"
                ] = (el as HTMLInputElement).checked)
              }
            />
            Allow international COD
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Pending checkout expiry (minutes)
            <input
              name="autoCancelPendingMinutes"
              type="number"
              min="5"
              step="1"
              value={settingsForm.autoCancelPendingMinutes}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)[
                  "autoCancelPendingMinutes"
                ] = el.value)
              }
              required
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Shipping zones JSON
            <textarea
              name="shippingZones"
              rows={10}
              value={settingsForm.shippingZones}
              onInput$={(_, el) =>
                ((settingsForm as Record<string, unknown>)["shippingZones"] =
                  el.value)
              }
              class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <div class="rounded-[1.25rem] bg-slate-100 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            These values control checkout pricing, COD eligibility, shipping
            zones, and auto-expiry for unpaid online orders.
          </div>

          <button
            type="submit"
            class="btn-admin w-full"
            disabled={loading.value}
          >
            {loading.value ? "Saving…" : "Save store settings"}
          </button>
        </form>
      )}
    </section>
  );
});
