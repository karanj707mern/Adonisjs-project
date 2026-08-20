import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate, useLocation } from "@builder.io/qwik-city";
import { getOrders, cancelOrder, getOrderInvoice } from "~/lib/api/order";
import { formatRupees, formatMediumDate } from "~/lib/formatters";
import { resolveImageUrl } from "~/lib/config";
import { toast } from "~/lib/toast";

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

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const id = loc.url.pathname.split("/").pop() ?? "";

  const state = useStore<{
    order: Order | null;
    loading: boolean;
    cancelling: boolean;
    downloading: boolean;
  }>({
    order: null,
    loading: true,
    cancelling: false,
    downloading: false,
  });

  useVisibleTask$(async () => {
    try {
      const data = await getOrders();
      const list: Order[] = Array.isArray(data)
        ? (data as Order[])
        : ((data as { orders?: Order[] })?.orders ?? []);
      state.order = list.find((o) => String(o.id) === id) ?? null;
    } catch {
      state.order = null;
    } finally {
      state.loading = false;
    }
  });

  const handleCancel = $(async () => {
    if (!state.order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;
    state.cancelling = true;
    try {
      await cancelOrder(state.order.id);
      toast.success("Order cancelled");
      await nav("/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
      state.cancelling = false;
    }
  });

  const handleInvoice = $(async () => {
    if (!state.order) return;
    state.downloading = true;
    try {
      const blob = await getOrderInvoice(state.order.id);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${state.order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      state.downloading = false;
    }
  });

  if (state.loading) {
    return (
      <div class="container-page py-20 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!state.order) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Order not found</h1>
        <p class="mt-2 text-slate-500">
          The order you're looking for doesn't exist.
        </p>
        <a href="/orders" class="btn-primary mt-6">
          Back to orders
        </a>
      </div>
    );
  }

  const order = state.order;
  const statusSteps = ["pending", "processing", "shipped", "delivered"];
  const currentStatusIndex = statusSteps.indexOf(order.status ?? "");

  return (
    <div class="container-page py-10">
      <a
        href="/orders"
        class="text-sm text-neon hover:underline"
        onClick$={(e) => {
          e.preventDefault();
          nav("/orders");
        }}
      >
        ← All orders
      </a>

      <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold">Order #{order.id}</h1>
          <p class="mt-1 text-sm text-slate-500">
            {order.createdAt ? formatMediumDate(order.createdAt) : "—"} ·{" "}
            {order.status ?? "Processing"}
          </p>
        </div>
        <div class="flex gap-2">
          {order.status !== "cancelled" && (
            <>
              <button
                type="button"
                class="btn-secondary"
                disabled={state.downloading}
                onClick$={handleInvoice}
              >
                {state.downloading ? "Downloading…" : "Invoice"}
              </button>
              <button
                type="button"
                class="btn-ghost text-rose-500"
                disabled={state.cancelling}
                onClick$={handleCancel}
              >
                {state.cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status timeline */}
      {currentStatusIndex >= 0 && (
        <div class="mt-8">
          <div class="flex items-center justify-between">
            {statusSteps.map((step, idx) => (
              <div key={step} class="flex flex-1 flex-col items-center">
                <div
                  class={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    idx <= currentStatusIndex
                      ? "bg-neon text-white"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-800"
                  }`}
                >
                  {idx <= currentStatusIndex ? "✓" : idx + 1}
                </div>
                <span class="mt-2 text-xs capitalize text-slate-600 dark:text-slate-400">
                  {step}
                </span>
              </div>
            ))}
          </div>
          <div class="mt-2 h-1 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              class="h-1 rounded-full bg-neon transition-all"
              style={{
                width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div class="mt-8 space-y-3">
        <h2 class="text-xl font-bold">Items</h2>
        {(order.items ?? []).map((line) => (
          <div
            key={line.id}
            class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
          >
            {line.image ? (
              <img
                src={resolveImageUrl(line.image)}
                alt={line.name ?? "Item"}
                class="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div class="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                No img
              </div>
            )}
            <div class="flex-1">
              <p class="font-medium">{line.name ?? "Item"}</p>
              <p class="text-sm text-slate-500">Qty: {line.quantity ?? 1}</p>
            </div>
            <span class="font-semibold">{formatRupees(line.price)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div class="mt-6 flex justify-end">
        <div class="card p-6 text-right">
          <p class="text-sm text-slate-500">Total</p>
          <p class="text-2xl font-bold">{formatRupees(order.total)}</p>
        </div>
      </div>

      {/* Support */}
      <div class="mt-8">
        <h2 class="text-xl font-bold">Need help with this order?</h2>
        <p class="mt-1 text-sm text-slate-500">
          Report an issue and our team will look into it.
        </p>
        <div class="mt-4 flex gap-3">
          <input
            class="input flex-1"
            placeholder="Describe your issue"
            onInput$={(_, el) => {
              (state.order as Order & { issueMessage?: string }).issueMessage =
                el.value;
            }}
          />
          <button
            type="button"
            class="btn-primary"
            onClick$={() => {
              const msg = (state.order as Order & { issueMessage?: string })
                .issueMessage;
              if (!msg?.trim()) {
                toast.error("Please describe your issue");
                return;
              }
              // createOrderIssue would be imported; for now just toast
              toast.success("Support ticket created (demo)");
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
});
