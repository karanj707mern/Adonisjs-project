import { component$ } from "@builder.io/qwik";
import AdminGuard from "~/components/admin/admin-guard";
import AdminSidebar from "~/components/admin/admin-sidebar";
import AdminRedirect from "~/components/admin/admin-redirect";

export default component$(() => {
  return (
    <AdminRedirect>
      <div class="flex min-h-screen">
        <AdminSidebar />
        <main class="flex-1 overflow-y-auto">
          <AdminGuard>
            <div class="container-page py-10">
              <div class="mb-8">
                <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Content
                </p>
                <h1 class="mt-1 font-serif text-3xl text-slate-900 sm:text-4xl dark:text-slate-100">
                  Blog
                </h1>
                <p class="mt-2 text-slate-600 dark:text-slate-300">
                  Manage wellness blog posts. Create, edit, and publish articles
                  about moringa benefits, recipes, and healthy living.
                </p>
              </div>
              <div class="card mt-6 space-y-3 p-4">
                <input
                  class="input"
                  placeholder="New post title"
                  onInput$={(_, el) => {
                    // Blog creation handled via API in future iteration
                  }}
                />
                <button type="button" class="btn-primary" disabled>
                  Create post (coming soon)
                </button>
              </div>
              <p class="mt-6 text-sm text-slate-500">
                Use the public blog editor or API to create posts. This admin
                panel will be enhanced in the next iteration.
              </p>
            </div>
          </AdminGuard>
        </main>
      </div>
    </AdminRedirect>
  );
});
