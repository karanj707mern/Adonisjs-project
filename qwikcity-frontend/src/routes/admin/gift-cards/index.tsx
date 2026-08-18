import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import AdminGuard from "~/components/admin/admin-guard";
import AdminSidebar from "~/components/admin/admin-sidebar";
import AdminRedirect from "~/components/admin/admin-redirect";
import { getAdminGiftCards, createGiftCard, updateGiftCard, removeGiftCard, redeemGiftCard } from "~/lib/api/gift-card";
import { formatRupees } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface GiftCard {
  id: string | number;
  code?: string;
  balance?: number;
  isActive?: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export default component$(() => {
  const state = useStore<{
    items: GiftCard[];
    loading: boolean;
    error: string;
    creating: boolean;
    code: string;
    amount: string;
    expiresAt: string;
    active: boolean;
    redeemCode: string;
    redeemResult: { balance: number } | null;
    redeemLoading: boolean;
  }>({
    items: [],
    loading: true,
    error: "",
    creating: false,
    code: "",
    amount: "",
    expiresAt: "",
    active: true,
    redeemCode: "",
    redeemResult: null,
    redeemLoading: false,
  });

  const load = $(async () => {
    try {
      const data = await getAdminGiftCards();
      const list = Array.isArray(data)
        ? (data as GiftCard[])
        : ((data as { giftCards?: GiftCard[] })?.giftCards ?? []);
      state.items = list;
      state.error = "";
    } catch (err) {
      state.error = err instanceof Error ? err.message : "Could not load gift cards.";
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await load();
  });

  const handleCreate = $(async () => {
    if (!state.code.trim() || !state.amount) return;
    state.creating = true;
    try {
      await createGiftCard({
        code: state.code.trim(),
        amount: Number(state.amount),
        isActive: state.active,
        expiresAt: state.expiresAt || undefined,
      });
      toast.success("Gift card created");
      state.code = "";
      state.amount = "";
      state.expiresAt = "";
      state.active = true;
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      state.creating = false;
    }
  });

  const handleDelete = $(async (id: string | number) => {
    try {
      await removeGiftCard(id);
      toast.success("Gift card deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  });

  const handleToggleActive = $(async (card: GiftCard) => {
    try {
      await updateGiftCard(card.id, { isActive: !card.isActive });
      toast.success("Updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  });

  const handleRedeem = $(async () => {
    if (!state.redeemCode.trim()) return;
    state.redeemLoading = true;
    state.redeemResult = null;
    try {
      const result = await redeemGiftCard(state.redeemCode.trim());
      const balance =
        typeof result === "object" && result !== null
          ? ((result as { balance?: number }).balance ?? (result as { amount?: number }).amount)
          : result;
      state.redeemResult = { balance: typeof balance === "number" ? balance : Number(balance) || 0 };
      toast.success("Gift card redeemed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      state.redeemLoading = false;
    }
  });

  return (
    <AdminRedirect>
      <div class="flex min-h-screen">
        <AdminSidebar />
        <main class="flex-1 overflow-y-auto">
          <AdminGuard>
            <div class="container-page py-10">
              <h1 class="text-2xl font-bold">Gift Cards</h1>

              {/* Redeem section */}
              <div class="card mt-6 p-6">
                <h2 class="text-lg font-semibold">Redeem gift card</h2>
                <div class="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    class="input sm:max-w-xs"
                    placeholder="Enter gift card code"
                    value={state.redeemCode}
                    onInput$={(_, el) => (state.redeemCode = el.value)}
                  />
                  <button
                    type="button"
                    class="btn-primary"
                    disabled={state.redeemLoading}
                    onClick$={handleRedeem}
                  >
                    {state.redeemLoading ? "Redeeming…" : "Redeem"}
                  </button>
                </div>
                {state.redeemResult && (
                  <p class="mt-3 text-sm">Remaining balance: ₹{state.redeemResult.balance}</p>
                )}
              </div>

              {/* Create section */}
              <form
                class="card mt-6 flex flex-col gap-3 p-4 sm:flex-row"
                preventdefault:submit
                onSubmit$={handleCreate}
              >
                <input
                  class="input flex-1"
                  placeholder="Code"
                  value={state.code}
                  onInput$={(_, el) => (state.code = el.value)}
                  required
                />
                <input
                  class="input w-32"
                  placeholder="Amount (₹)"
                  type="number"
                  min="0"
                  value={state.amount}
                  onInput$={(_, el) => (state.amount = el.value)}
                  required
                />
                <input
                  class="input w-44"
                  placeholder="Expires at (optional)"
                  type="date"
                  value={state.expiresAt}
                  onInput$={(_, el) => (state.expiresAt = el.value)}
                />
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.active}
                    onChange$={(_, el) => (state.active = (el as HTMLInputElement).checked)}
                  />
                  Active
                </label>
                <button type="submit" class="btn-primary" disabled={state.creating}>
                  {state.creating ? "Creating…" : "Create"}
                </button>
              </form>

              {/* List */}
              {state.loading ? (
                <p class="mt-6 text-sm text-slate-500">Loading…</p>
              ) : state.error ? (
                <p class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  {state.error}
                </p>
              ) : (
                <div class="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th class="px-4 py-3">Code</th>
                        <th class="px-4 py-3">Balance</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3">Expires</th>
                        <th class="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map((item) => (
                        <tr
                          key={item.id}
                          class="border-t border-slate-200 dark:border-slate-800"
                        >
                          <td class="px-4 py-3 font-mono">{item.code ?? item.id}</td>
                          <td class="px-4 py-3">{formatRupees(item.balance)}</td>
                          <td class="px-4 py-3">
                            <button
                              type="button"
                              class="text-xs"
                              onClick$={() => handleToggleActive(item)}
                            >
                              {item.isActive ? "Active" : "Hidden"}
                            </button>
                          </td>
                          <td class="px-4 py-3 text-xs text-slate-500">
                            {item.expiresAt ?? "—"}
                          </td>
                          <td class="px-4 py-3 text-right">
                            <button
                              type="button"
                              class="text-sm text-rose-500 hover:underline"
                              onClick$={() => handleDelete(item.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {state.items.length === 0 && (
                        <tr>
                          <td colSpan={5} class="px-4 py-8 text-center text-slate-500">
                            No gift cards yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </AdminGuard>
        </main>
      </div>
    </AdminRedirect>
  );
});
