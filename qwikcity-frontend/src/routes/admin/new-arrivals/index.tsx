import { component$ } from "@builder.io/qwik";
import AdminGuard from "~/components/admin/admin-guard";
import AdminSidebar from "~/components/admin/admin-sidebar";
import AdminRedirect from "~/components/admin/admin-redirect";
import NewArrivalsManager from "~/components/admin/new-arrivals-manager";

export default component$(() => {
  return (
    <AdminRedirect>
      <div class="flex min-h-screen">
        <AdminSidebar />
        <main class="flex-1 overflow-y-auto">
          <AdminGuard>
            <div class="container-page py-10">
              <NewArrivalsManager />
            </div>
          </AdminGuard>
        </main>
      </div>
    </AdminRedirect>
  );
});
