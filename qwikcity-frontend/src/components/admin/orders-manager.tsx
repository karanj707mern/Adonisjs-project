import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  getOpenOrders,
  getCancelledOrders,
  updateOrderStatus,
  refundOrder,
} from "~/lib/api/order";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { resolveImageUrl } from "~/lib/config";
import { toast } from "~/lib/toast";
import type { OrderSocketStore } from "~/hooks/useOrderSocket";

const OPEN_ORDER_STATUSES = new Set([
  "pending", "processing", "shipped", "delivered"
]);

function getAllowedActions(status: string): string[] {
  if (!status || status === "cancelled" || status === "delivered") return [];
  switch (status) {
    case "pending": return ["processing", "shipped", "cancelled"];
    case "processing": return ["shipped", "cancelled"];
    case "shipped": return ["delivered"];
    case "out_for_delivery": return ["delivered"];
    default: return [];
  }
}

function toFormState(order: Record<string, unknown>) {
  return {
    courierName: (order.courierName as string) ?? "",
    trackingNumber: (order.trackingNumber as string) ?? "",
    estimatedDeliveryAt: (order.estimatedDeliveryAt as string) ? new Date(order.estimatedDeliveryAt as string).toISOString().slice(0, 10) : "",
    adminNotes: (order.adminNotes as string) ?? "",
    note: "",
  };
}

export default component$(() => {
  const nav = useNavigate();
  const socket = useSignal<OrderSocketStore | null>(null);
  const openOrders = useStore<Record<string, unknown>[]>([]);
  const cancelledOrders = useStore<Record<string, unknown>[]>([]);
  const orderForms = useStore<Record<string | number, Record<string, unknown>>>({});
  const searchTerm = useSignal("");
  const sortBy = useSignal("newest");
  const loading = useSignal(true);
  const error = useSignal("");
  const activeTab = useSignal<"active" | "cancelled">("active");

  const loadOrders = $(async () => {
    loading.value = true;
    try {
      const [openData, cancelledData] = await Promise.all([
        getOpenOrders(),
        getCancelledOrders(),
      ]);
      const openList = Array.isArray(openData) ? openData as Record<string, unknown>[] : [];
      const cancelledList = Array.isArray(cancelledData) ? cancelledData as Record<string, unknown>[] : [];
      openOrders.length = 0;
      cancelledOrders.length = 0;
      openList.forEach((o) => openOrders.push(o));
      cancelledList.forEach((o) => cancelledOrders.push(o));
      const next = { ...orderForms };
      for (const order of [...openList, ...cancelledList]) {
        next[order.id as string | number] = {
          ...toFormState(order),
          ...(next[order.id as string | number] || {}),
          note: next[order.id as string | number]?.note ?? "",
        };
      }
      // orderForms is a Record, not an array; reset by clearing keys
      for (const key of Object.keys(orderForms)) {
        delete orderForms[key];
      }
      Object.entries(next).forEach(([k, v]) => (orderForms[k] = v));
      error.value = "";
    } catch (err) {
      if ((err as Error & { status: number }).status === 401 || (err as Error & { status: number }).status === 403) {
        nav("/auth?from=" + encodeURIComponent("/admin/orders"));
        return;
      }
      error.value = (err as Error).message || "Could not load orders.";
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadOrders();
  });

  const handleFieldChange = $((orderId: string | number, field: string, value: string) => {
    const current = orderForms[orderId] || {};
    orderForms[orderId] = { ...current, [field]: value };
  });

  const handleStatusChange = $(async (orderId: string | number, status: string) => {
    try {
      const form = orderForms[orderId] || {};
      await updateOrderStatus(orderId, {
        status,
        courierName: (form.courierName as string)?.trim() || undefined,
        trackingNumber: (form.trackingNumber as string)?.trim() || undefined,
        estimatedDeliveryAt: form.estimatedDeliveryAt || undefined,
        adminNotes: (form.adminNotes as string)?.trim() || undefined,
        note: (form.note as string)?.trim() || undefined,
      });
      toast.success(`Order updated to ${status.toLowerCase()}.`);
      await loadOrders();
    } catch (err) {
      if ((err as Error & { status: number }).status === 401 || (err as Error & { status: number }).status === 403) {
        nav("/auth?from=" + encodeURIComponent("/admin/orders"));
        return;
      }
      toast.error((err as Error).message || "Could not update order status.");
    }
  });

  const handleRefund = $(async (orderId: string | number) => {
    try {
      await refundOrder(orderId);
      toast.success("Refund processed");
      await loadOrders();
    } catch (err) {
      toast.error((err as Error).message || "Could not process refund.");
    }
  });

  const activeList = activeTab.value === "active" ? openOrders : cancelledOrders;
  const filtered = activeList.filter((order) => {
    const term = searchTerm.value.trim().toLowerCase();
    if (!term) return true;
    const user = order.user as Record<string, unknown> | undefined;
    const items = (order.items as Record<string, unknown>[] | []) || [];
    return [
      order.orderTitle as string,
      order.orderNumber as string,
      user?.name as string,
      user?.email as string,
      ...items.map((item) => (item.product as Record<string, unknown>)?.name as string),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term);
  }).sort((left, right) => {
    if (sortBy.value === "name") {
      return String(left.orderTitle || "").localeCompare(String(right.orderTitle || ""));
    }
    if (sortBy.value === "oldest") {
      return new Date(left.createdAt as string).getTime() - new Date(right.createdAt as string).getTime();
    }
    return new Date(right.createdAt as string).getTime() - new Date(left.createdAt as string).getTime();
  });

  return (
    <section class="admin-card rounded-xl p-4 shadow-sm sm:p-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {activeTab.value === "active" ? "Active orders" : "Cancelled orders"}
          </p>
          <h2 class="mt-1 font-serif text-xl text-slate-900 sm:text-2xl dark:text-slate-100">
            {activeTab.value === "active" ? "Shipment queue" : "Cancelled orders"}
          </h2>
        </div>
        <div class="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
          <button
            type="button"
            onClick$={() => (activeTab.value = "active")}
            class={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab.value === "active"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
            }`}
          >
            Active ({openOrders.length})
          </button>
          <button
            type="button"
            onClick$={() => (activeTab.value = "cancelled")}
            class={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab.value === "cancelled"
                ? "bg-red-700 text-white shadow-sm"
                : "text-slate-600 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-300"
            }`}
          >
            Cancelled ({cancelledOrders.length})
          </button>
        </div>
      </div>

      {error.value && (
        <div class="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error.value}
        </div>
      )}

      <div class="mt-5 grid gap-3 md:grid-cols-[1fr_200px]">
        <input
          value={searchTerm.value}
          onInput$={(_, el) => (searchTerm.value = el.value)}
          placeholder="Search by product, order number, customer, or email"
          aria-label="Search orders"
          class="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={sortBy.value}
          onChange$={(_, el) => (sortBy.value = (el as HTMLSelectElement).value)}
          class="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Product name</option>
        </select>
      </div>

      <div class="mt-6 space-y-3">
        {loading.value ? (
          <div class="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div class="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No orders found.</div>
        ) : (
          filtered.map((order) => {
            const allowed = activeTab.value === "active" ? getAllowedActions(order.status as string) : [];
            const user = order.user as Record<string, unknown> | undefined;
            const items = (order.items as Record<string, unknown>[] | []) || [];
            const form = orderForms[order.id as string | number] || toFormState(order);

            return (
              <div key={order.id as string | number} class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-medium">Order #{String(order.orderNumber ?? order.id)}</p>
                    <p class="mt-1 text-sm text-slate-500">
                      {order.createdAt ? formatMediumDate(order.createdAt as string) : ""} · {(order.status as string) ?? "—"}
                    </p>
                    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {user?.name ? `${user.name as string}` : "Guest"} {user?.email ? `· ${user.email as string}` : ""}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold">{formatRupees(order.total as number)}</p>
                    <p class="mt-1 text-xs text-slate-400">{items.length} item{items.length === 1 ? "" : "s"}</p>
                  </div>
                </div>

                {/* Items */}
                <div class="mt-3 space-y-2">
                  {items.map((item: Record<string, unknown>, idx: number) => {
                    const product = item.product as Record<string, unknown> | undefined;
                    return (
                      <div key={idx} class="flex items-center gap-3 rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                        {product?.image ? (
                          <img src={resolveImageUrl(product.image as string)} alt="" class="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div class="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">No img</div>
                        )}
                        <div class="flex-1">
                          <p class="text-sm font-medium">{((product?.name as string | undefined) ?? "Item")}</p>
                          <p class="text-xs text-slate-500">Qty: {item.quantity as number ?? 1}</p>
                        </div>
                        <span class="text-sm font-semibold">{formatRupees(item.price as number)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {activeTab.value === "active" && allowed.length > 0 && (
                  <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <select
                      value={(order.status as string) ?? ""}
                      onChange$={(_, el) => handleStatusChange(order.id as string | number, (el as HTMLSelectElement).value)}
                      class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="" disabled>Change status…</option>
                      {allowed.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    {(order.status as string) !== "cancelled" && (
                      <button
                        type="button"
                        class="btn-ghost text-xs text-rose-500"
                        onClick$={() => handleRefund(order.id as string | number)}
                      >
                        Refund
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
});
