import { component$, Slot } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { Toaster } from "~/components/toaster";
import { MainLayout } from "~/components/layouts/main-layout";
import { AdminLayout } from "~/components/layouts/admin-layout";

export default component$(() => {
  const loc = useLocation();
  const isAdmin = loc.url.pathname.startsWith("/admin");

  return (
    <>
      {isAdmin ? (
        <AdminLayout>
          <Slot />
        </AdminLayout>
      ) : (
        <MainLayout>
          <Slot />
        </MainLayout>
      )}
      <Toaster />
    </>
  );
});
