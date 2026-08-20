import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getAdminIssues, updateOrderIssue } from "~/lib/api/order";
import { formatMediumDate } from "~/lib/formatters";
import { toast } from "~/lib/toast";

export default component$(() => {
  const nav = useNavigate();
  const issues = useStore<Record<string, unknown>[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");

  const loadIssues = $(async () => {
    loading.value = true;
    try {
      const data = await getAdminIssues();
      issues.length = 0;
      const list = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : [];
      list.forEach((i) => issues.push(i));
      error.value = "";
    } catch (err) {
      if (
        (err as Error & { status: number }).status === 401 ||
        (err as Error & { status: number }).status === 403
      ) {
        nav("/auth?from=" + encodeURIComponent("/admin/support"));
        return;
      }
      error.value = (err as Error).message || "Could not load support issues.";
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadIssues();
  });

  const handleIssueUpdate = $(
    async (issueId: string | number, payload: Record<string, unknown>) => {
      try {
        const updatedIssue = (await updateOrderIssue(
          issueId,
          payload,
        )) as Record<string, unknown>;
        const idx = issues.findIndex((i) => i.id === issueId);
        if (idx !== -1) issues[idx] = updatedIssue;
        toast.success("Support issue updated successfully.");
        error.value = "";
      } catch {
        toast.error("Could not update the issue.");
      }
    },
  );

  return (
    <section class="admin-card rounded-xl p-4 shadow-sm sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Support issues
          </p>
          <h2 class="mt-1 font-serif text-xl text-slate-900 sm:text-2xl dark:text-slate-100">
            Returns, refunds, disputes
          </h2>
        </div>
      </div>

      {error.value && (
        <div class="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error.value}
        </div>
      )}

      <div class="mt-6 space-y-3">
        {loading.value ? (
          <div class="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
            Loading support issues…
          </div>
        ) : issues.length === 0 ? (
          <div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-100 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No support issues are waiting for review right now.
          </div>
        ) : (
          issues.map((issue) => {
            const order = issue.order as Record<string, unknown> | undefined;
            const user = issue.user as Record<string, unknown> | undefined;
            return (
              <article
                key={issue.id as string | number}
                class="admin-card rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {(order?.orderNumber as string) || `Order #${order?.id}`}
                    </p>
                    <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {issue.title as string}
                    </h3>
                    <p class="mt-1 text-xs text-slate-500">
                      {order?.orderTitle as string} · {user?.name as string} ·{" "}
                      {user?.email as string}
                    </p>
                  </div>
                  <div class="text-left sm:text-right">
                    <p class="text-xs text-slate-500">
                      {(issue.type as string).replace(/_/g, " ")}
                    </p>
                    <p class="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {(issue.status as string).replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {issue.description as string}
                </p>

                <div class="mt-3 grid gap-2.5 md:grid-cols-[200px_1fr]">
                  <select
                    value={issue.status as string}
                    onChange$={(_, el) =>
                      handleIssueUpdate(issue.id as string | number, {
                        status: (el as HTMLSelectElement).value,
                      })
                    }
                    class="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="OPEN">Open</option>
                    <option value="UNDER_REVIEW">Under review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button
                    type="button"
                    onClick$={() =>
                      handleIssueUpdate(issue.id as string | number, {
                        adminResponse:
                          (issue.adminResponse as string) ||
                          "We reviewed your request and updated the support ticket.",
                        resolutionSummary:
                          (issue.resolutionSummary as string) ||
                          "We reviewed your request and updated the support ticket.",
                      })
                    }
                    class="btn-secondary px-3 py-1.5 text-sm"
                  >
                    Apply quick response
                  </button>
                </div>

                {(issue.adminResponse as string) && (
                  <p class="mt-2.5 text-sm text-slate-600 dark:text-slate-300">
                    Admin: {issue.adminResponse as string}
                  </p>
                )}
                {(issue.resolutionSummary as string) && (
                  <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    Resolution: {issue.resolutionSummary as string}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
});
