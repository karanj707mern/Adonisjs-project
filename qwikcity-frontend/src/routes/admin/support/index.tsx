import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getAdminIssues, updateOrderIssue } from "~/lib/api/order";
import { formatMediumDateTime } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface Issue {
  id: string | number;
  orderId?: string | number;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
}

export default component$(() => {
  const state = useStore<{ items: Issue[]; loading: boolean }>({ items: [], loading: true });

  const refresh = $(async () => {
    try {
      const data = await getAdminIssues();
      const list = Array.isArray(data)
        ? (data as Issue[])
        : ((data as { issues?: Issue[] })?.issues ?? []);
      state.items = list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load issues");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <h1 class="text-2xl font-bold">Support</h1>
      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : state.items.length === 0 ? (
        <p class="mt-6 text-sm text-slate-500">No open support tickets.</p>
      ) : (
        <div class="mt-6 space-y-4">
          {state.items.map((item) => (
            <div key={item.id} class="card p-4">
              <div class="flex items-center justify-between">
                <p class="font-medium">{item.subject ?? "Support ticket"}</p>
                <span class="text-xs text-slate-400">{item.createdAt ? formatMediumDateTime(item.createdAt) : ""}</span>
              </div>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              <div class="mt-3 flex items-center gap-3">
                <span class="text-xs text-slate-500">Order #{item.orderId ?? "—"}</span>
                <select
                  class="input w-auto"
                  value={item.status ?? "open"}
                  onChange$={async (_e, currentTarget) => {
                    try {
                      await updateOrderIssue(item.id, { status: (currentTarget as HTMLSelectElement).value });
                      toast.success("Updated");
                      await refresh();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Update failed");
                    }
                  }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
