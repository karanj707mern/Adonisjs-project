import { component$, useStore } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";
import { getGiftCardBalance } from "~/lib/api/gift-card";
import { toast } from "~/lib/toast";

export default component$(() => {
  const check = useStore({
    code: "",
    balance: null as number | null,
    loading: false,
  });

  return (
    <InfoPage pageKey="gift-cards">
      <p>
        Moringa gift cards never expire and can be applied to any product in our
        store at checkout.
      </p>

      <div class="card mt-4 p-6">
        <h2 class="text-lg font-semibold">Check your balance</h2>
        <div class="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            class="input sm:max-w-xs"
            placeholder="Enter gift card code"
            value={check.code}
            onInput$={(_, el) => (check.code = el.value)}
          />
          <button
            type="button"
            class="btn-primary"
            disabled={check.loading}
            onClick$={async () => {
              if (!check.code.trim()) return;
              check.loading = true;
              try {
                const result = await getGiftCardBalance(check.code.trim());
                const balance =
                  typeof result === "object" && result !== null
                    ? ((result as { balance?: number }).balance ??
                      (result as { amount?: number }).amount)
                    : result;
                check.balance =
                  typeof balance === "number" ? balance : Number(balance) || 0;
                toast.success("Balance retrieved");
              } catch (err) {
                check.balance = null;
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Could not fetch balance",
                );
              } finally {
                check.loading = false;
              }
            }}
          >
            {check.loading ? "Checking…" : "Check"}
          </button>
        </div>
        {check.balance !== null ? (
          <p class="mt-3 text-sm">Current balance: ₹{check.balance}</p>
        ) : null}
      </div>
    </InfoPage>
  );
});
