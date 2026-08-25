import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { getAdminOverview, type AdminOverview } from "~/lib/api/admin";
import { toast } from "~/lib/toast";

export const useAdminOverview = routeLoader$(async () => {
  try {
    return await getAdminOverview();
  } catch {
    return null;
  }
});

export default component$(() => {
  const overview = useAdminOverview();
  const loading = useSignal(!overview.value);
  const error = useSignal("");

  // Fallback: if routeLoader returns null, fetch client-side
  useVisibleTask$(async () => {
    if (!overview.value) {
      try {
        loading.value = true;
        const data = await getAdminOverview();
        overview.value = data;
      } catch (err) {
        error.value = (err as Error).message || "Failed to load dashboard";
      } finally {
        loading.value = false;
      }
    }
  });

  const stats = [
    {
      label: "Products",
      value: overview.value?.productCount ?? 0,
      href: "/admin/products",
      color: "bg-emerald-700",
      icon: "📦",
    },
    {
      label: "Open orders",
      value: overview.value?.openOrderCount ?? 0,
      href: "/admin/orders",
      color: "bg-sky-700",
      icon: "🧾",
    },
    {
      label: "Cancelled",
      value: overview.value?.cancelledOrderCount ?? 0,
      href: "/admin/orders?status=CANCELLED",
      color: "bg-red-700",
      icon: "🚫",
    },
    {
      label: "Support issues",
      value: overview.value?.issueCount ?? 0,
      href: "/admin/support",
      color: "bg-amber-700",
      icon: "⚠️",
    },
    {
      label: "Blog posts",
      value: overview.value?.blogCount ?? 0,
      href: "/admin/blog",
      color: "bg-stone-800",
      icon: "✎",
    },
  ];

  const revenue = [
    {
      label: "Cash on delivery",
      value: overview.value?.codCollected ?? 0,
      color: "bg-amber-500",
      icon: "💵",
    },
    {
      label: "Online payments",
      value: overview.value?.onlineCollected ?? 0,
      color: "bg-emerald-500",
      icon: "💳",
    },
  ];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (error.value) {
    return (
      <div class="container-page py-10">
        <div class="card border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error.value}
        </div>
      </div>
    );
  }

  return (
    <div class="container-page py-10">
      <div class="mb-8">
        <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Dashboard
        </p>
        <h1 class="mt-1 font-serif text-3xl text-slate-900 sm:text-4xl dark:text-slate-100">
          Overview
        </h1>
        <p class="mt-2 text-slate-600 dark:text-slate-300">
          Welcome to the Moringa management console.
        </p>
      </div>

      {/* Stats grid */}
      <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            class="card flex flex-col gap-2 p-5 transition hover:border-emerald-300 hover:shadow-md"
          >
            <div class="flex items-center justify-between">
              <span class="text-2xl">{stat.icon}</span>
              <span
                class={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${stat.color}`}
              >
                {loading.value ? "…" : stat.value}
              </span>
            </div>
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
              {stat.label}
            </p>
          </a>
        ))}
      </div>

      {/* Revenue */}
      <div class="mb-8 grid gap-4 sm:grid-cols-2">
        {revenue.map((rev) => (
          <div key={rev.label} class="card flex items-center gap-4 p-5">
            <span
              class={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl text-white ${rev.color}`}
            >
              {rev.icon}
            </span>
            <div>
              <p class="text-sm text-slate-500">{rev.label}</p>
              <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {loading.value ? "…" : formatCurrency(rev.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div class="card p-6">
        <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent Orders
        </h2>
        {(!overview.value?.recentOrders ||
          overview.value.recentOrders.length === 0) && (
          <p class="text-sm text-slate-500">No recent orders.</p>
        )}
        {overview.value?.recentOrders &&
          overview.value.recentOrders.length > 0 && (
            <div class="space-y-3">
              {overview.value.recentOrders.map((order) => (
                <div
                  key={order.id}
                  class="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-slate-900 dark:text-slate-100">
                      {order.orderTitle}
                    </p>
                    <p class="text-xs text-slate-500">
                      {order.orderNumber} • {order.user.name}
                    </p>
                  </div>
                  <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
});
