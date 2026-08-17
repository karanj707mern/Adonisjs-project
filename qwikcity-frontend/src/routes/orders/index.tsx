import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useCurrentUser } from "~/lib/storage";
import { getOrders } from "~/lib/api/order";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface OrderLine {
  id: string | number;
  productId?: string | number;
  name?: string;
  quantity?: number;
  price?: number;
}

interface Order {
  id: string | number;
  createdAt?: string;
  status?: string;
  total?: number;
  items?: OrderLine[];
}

function normalize(data: unknown): Order[] {
  if (Array.isArray(data)) return data as Order[];
  if (data && typeof data === "object" && Array.isArray((data as { orders?: unknown }).orders)) {
    return (data as { orders: Order[] }).orders;
  }
  return [];
}

export default component$(() => {
  const user = useCurrentUser();
  const state = useStore<{ orders: Order[]; loading: boolean; error: string }>({
    orders: [],
    loading: true,
    error: "",
  });

  useVisibleTask$(async () => {
    try {
      const data = await getOrders();
      state.orders = normalize(data);
    } catch (err) {
      state.error = err instanceof Error ? err.message : "Could not load orders";
    } finally {
      state.loading = false;
    }
  });

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">My Orders</h1>

      {!user.user ? (
        <p class="mt-6 text-slate-500">
          Please <a href="/auth" class="text-neon hover:underline">sign in</a> to view your orders.
        </p>
      ) : state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : state.error ? (
        <p class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </p>
      ) : state.orders.length === 0 ? (
        <p class="mt-6 text-sm text-slate-500">You have no orders yet.</p>
      ) : (
        <div class="mt-6 space-y-4">
          {state.orders.map((order) => (
            <a key={order.id} href={`/orders/${order.id}`} class="card flex items-center justify-between p-4 hover:border-neon">
              <div>
                <p class="font-medium">Order #{order.id}</p>
                <p class="text-sm text-slate-500">
                  {order.createdAt ? formatMediumDate(order.createdAt) : ""} · {order.status ?? "Processing"}
                </p>
              </div>
              <span class="font-semibold">{formatRupees(order.total)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
});
