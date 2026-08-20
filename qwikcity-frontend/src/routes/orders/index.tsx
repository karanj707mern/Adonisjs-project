import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useOrdersLogic } from "~/hooks/useOrdersLogic";
import { useCurrentUser } from "~/lib/storage";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { toast } from "~/lib/toast";

export default component$(() => {
  const nav = useNavigate();
  const user = useCurrentUser();
  const {
    tab,
    loading,
    items,
    error,
    setTab,
    refresh,
    handleCancel,
    handleSupport,
  } = useOrdersLogic();

  useVisibleTask$(() => {
    refresh();
  });

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "all", label: "All Orders" },
    { key: "open", label: "In Progress" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">My Orders</h1>

      {!user.user ? (
        <div class="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
          <p>Please sign in to view your orders.</p>
          <a href="/auth" class="btn-primary mt-4">
            Sign in
          </a>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div class="mt-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick$={() => setTab(t.key)}
                class={`px-4 py-2 text-sm font-medium transition ${
                  tab === t.key
                    ? "border-b-2 border-neon text-neon"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error ? (
            <div class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : loading ? (
            <p class="mt-6 text-sm text-slate-500">Loading…</p>
          ) : items.length === 0 ? (
            <div class="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
              <p>No orders found in this view.</p>
              <a href="/shop" class="btn-primary mt-4">
                Browse products
              </a>
            </div>
          ) : (
            <div class="mt-6 space-y-4">
              {items.map((order) => (
                <div key={order.id} class="card overflow-hidden">
                  <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="font-semibold">Order #{order.id}</p>
                      <p class="mt-1 text-sm text-slate-500">
                        {order.createdAt
                          ? formatMediumDate(order.createdAt)
                          : "—"}{" "}
                        · {order.status ?? "Processing"}
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-lg font-bold">
                        {formatRupees(order.total)}
                      </span>
                      <a href={`/orders/${order.id}`} class="btn-secondary">
                        View
                      </a>
                    </div>
                  </div>

                  {/* Items preview */}
                  {(order.items ?? []).length > 0 && (
                    <div class="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                      <div class="flex flex-wrap gap-3">
                        {(order.items ?? []).slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                          >
                            <span class="font-medium">
                              {item.name ?? "Item"}
                            </span>
                            <span class="text-slate-500">
                              x{item.quantity ?? 1}
                            </span>
                          </div>
                        ))}
                        {(order.items ?? []).length > 3 && (
                          <span class="px-3 py-2 text-sm text-slate-500">
                            +{(order.items ?? []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div class="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                    <span class="text-xs text-slate-400">
                      {order.status === "pending" && "Awaiting processing"}
                      {order.status === "processing" && "Being prepared"}
                      {order.status === "shipped" && "On its way"}
                      {order.status === "delivered" && "Delivered"}
                      {order.status === "cancelled" && "Cancelled"}
                    </span>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="text-sm text-rose-500 hover:underline"
                        onClick$={() => handleCancel(order.id)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="text-sm text-neon hover:underline"
                        onClick$={() => {
                          const message = prompt("Describe your issue:");
                          if (message) {
                            handleSupport(order.id, message);
                          }
                        }}
                      >
                        Report issue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});
