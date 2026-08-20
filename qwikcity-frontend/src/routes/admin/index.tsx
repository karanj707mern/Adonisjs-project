import { component$ } from "@builder.io/qwik";
import AdminGuard from "~/components/admin/admin-guard";
import AdminSidebar, {
  ADMIN_NAV_ITEMS,
  type AdminNavItem,
} from "~/components/admin/admin-sidebar";
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
                  Dashboard
                </p>
                <h1 class="mt-1 font-serif text-3xl text-slate-900 sm:text-4xl dark:text-slate-100">
                  Overview
                </h1>
                <p class="mt-2 text-slate-600 dark:text-slate-300">
                  Welcome to the Moringa management console. Use the sidebar to
                  navigate between orders, products, marketing, support, and
                  settings.
                </p>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin").map(
                  (item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      class="card flex flex-col gap-2 p-6 transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <span class="text-2xl">{item.icon}</span>
                      <p class="font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p class="text-xs text-slate-500">{item.description}</p>
                    </a>
                  ),
                )}
              </div>
            </div>
          </AdminGuard>
        </main>
      </div>
    </AdminRedirect>
  );
});
