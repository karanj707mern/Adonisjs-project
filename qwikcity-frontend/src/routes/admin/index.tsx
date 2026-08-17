import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { getAdminOverview } from "~/lib/api/admin";
import { useCurrentUser } from "~/lib/storage";

interface Overview {
  totalOrders?: number;
  totalProducts?: number;
  totalRevenue?: number;
  openIssues?: number;
  [key: string]: unknown;
}

export default component$(() => {
  const user = useCurrentUser();
  const state = useStore<{ data: Overview | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: "",
  });

  useVisibleTask$(async () => {
    try {
      const data = await getAdminOverview();
      state.data = (data ?? {}) as Overview;
    } catch (err) {
      state.error = err instanceof Error ? err.message : "Could not load overview";
    } finally {
      state.loading = false;
    }
  });

  const cards = [
    { label: "Orders", value: state.data?.totalOrders },
    { label: "Products", value: state.data?.totalProducts },
    { label: "Revenue", value: state.data?.totalRevenue },
    { label: "Open issues", value: state.data?.openIssues },
  ];

  return (
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-500">
        Signed in as {typeof (user.user as { user?: { name?: string } })?.user?.name === "string" ? (user.user as { user: { name: string } }).user.name : "admin"}.
      </p>

      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : state.error ? (
        <p class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </p>
      ) : (
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} class="card p-6">
              <p class="text-sm text-slate-500">{card.label}</p>
              <p class="mt-2 text-3xl font-bold">
                {card.value === undefined || card.value === null ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
