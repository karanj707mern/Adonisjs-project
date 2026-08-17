import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { getOrders } from "~/lib/api/order";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { resolveImageUrl } from "~/lib/config";

interface OrderLine {
  id: string | number;
  name?: string;
  image?: string;
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

function findOrder(orders: Order[], id: string): Order | undefined {
  return orders.find((o) => String(o.id) === id);
}

export default component$(() => {
  const id = (window.location.pathname.split("/").pop() ?? "");
  const state = useStore<{ order: Order | null; loading: boolean }>({ order: null, loading: true });

  useVisibleTask$(async () => {
    try {
      const data = await getOrders();
      const list: Order[] = Array.isArray(data)
        ? (data as Order[])
        : ((data as { orders?: Order[] })?.orders ?? []);
      state.order = findOrder(list, id) ?? null;
    } catch {
      state.order = null;
    } finally {
      state.loading = false;
    }
  });

  if (state.loading) {
    return <div class="container-page py-20 text-center text-slate-500">Loading…</div>;
  }

  if (!state.order) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Order not found</h1>
        <a href="/orders" class="btn-primary mt-6">Back to orders</a>
      </div>
    );
  }

  const order = state.order;

  return (
    <div class="container-page py-10">
      <a href="/orders" class="text-sm text-neon hover:underline">← All orders</a>
      <h1 class="mt-4 text-3xl font-bold">Order #{order.id}</h1>
      <p class="mt-1 text-sm text-slate-500">
        {order.createdAt ? formatMediumDate(order.createdAt) : ""} · {order.status ?? "Processing"}
      </p>

      <div class="mt-6 space-y-3">
        {(order.items ?? []).map((line) => (
          <div key={line.id} class="card flex items-center gap-4 p-4">
            {line.image ? (
              <img src={resolveImageUrl(line.image)} alt={line.name ?? "Item"} class="h-16 w-16 rounded-lg object-cover" />
            ) : null}
            <div class="flex-1">
              <p class="font-medium">{line.name ?? "Item"}</p>
              <p class="text-sm text-slate-500">Qty: {line.quantity ?? 1}</p>
            </div>
            <span class="font-semibold">{formatRupees(line.price)}</span>
          </div>
        ))}
      </div>

      <div class="mt-6 flex justify-end">
        <span class="text-lg font-bold">Total: {formatRupees(order.total)}</span>
      </div>
    </div>
  );
});
