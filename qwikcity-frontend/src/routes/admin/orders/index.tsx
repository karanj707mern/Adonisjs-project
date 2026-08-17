import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getOrders, updateOrderStatus } from "~/lib/api/order";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface Order {
  id: string | number;
  createdAt?: string;
  status?: string;
  total?: number;
}

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default component$(() => {
  const state = useStore<{ items: Order[]; loading: boolean }>({ items: [], loading: true });

  const refresh = $(async () => {
    try {
      const data = await getOrders();
      const list = Array.isArray(data)
        ? (data as Order[])
        : ((data as { orders?: Order[] })?.orders ?? []);
      state.items = list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load orders");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <h1 class="text-2xl font-bold">Orders</h1>
      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div class="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th class="px-4 py-3">Order</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr key={item.id} class="border-t border-slate-200 dark:border-slate-800">
                  <td class="px-4 py-3 font-medium">#{item.id}</td>
                  <td class="px-4 py-3 text-slate-500">{item.createdAt ? formatMediumDate(item.createdAt) : "—"}</td>
                  <td class="px-4 py-3">{formatRupees(item.total)}</td>
                  <td class="px-4 py-3">
                    <select
                      class="input w-auto"
                      value={item.status ?? "pending"}
                      onChange$={async (e, currentTarget) => {
                        try {
                          await updateOrderStatus(item.id, (currentTarget as HTMLSelectElement).value);
                          toast.success("Status updated");
                          await refresh();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Update failed");
                        }
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
