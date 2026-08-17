import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getStoreSettings, updateStoreSettings } from "~/lib/api/settings";
import { toast } from "~/lib/toast";

interface Settings {
  storeName?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  [key: string]: unknown;
}

export default component$(() => {
  const state = useStore<{ settings: Settings; loading: boolean; saving: boolean }>({
    settings: {},
    loading: true,
    saving: false,
  });

  const refresh = $(async () => {
    try {
      const data = await getStoreSettings();
      state.settings = (data ?? {}) as Settings;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load settings");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <form
          class="card mt-6 max-w-lg space-y-4 p-6"
          preventdefault:submit
          onSubmit$={async () => {
            state.saving = true;
            try {
              await updateStoreSettings(state.settings);
              toast.success("Settings saved");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Save failed");
            } finally {
              state.saving = false;
            }
          }}
        >
          <div>
            <label class="mb-1 block text-sm font-medium">Store name</label>
            <input class="input" bind:value={state.settings.storeName} />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Support email</label>
            <input class="input" bind:value={state.settings.supportEmail} />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Support phone</label>
            <input class="input" bind:value={state.settings.supportPhone} />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Currency</label>
            <input class="input w-32" bind:value={state.settings.currency} />
          </div>
          <button type="submit" class="btn-primary" disabled={state.saving}>
            {state.saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
});
