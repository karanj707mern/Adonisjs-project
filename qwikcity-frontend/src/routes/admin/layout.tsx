import { type RequestHandler } from "@builder.io/qwik-city";
import { redirect } from "@builder.io/qwik-city";
import { component$, Slot } from "@builder.io/qwik";
import AdminSidebar from "~/components/admin/admin-sidebar";

export const onRequest: RequestHandler = async ({ cookie, redirect, url }) => {
  const sessionToken = cookie.get("accessToken")?.value;
  if (!sessionToken) {
    throw redirect(302, "/auth?from=" + encodeURIComponent(url.pathname));
  }

  try {
    const res = await fetch(
      `${import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/auth/profile`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: `accessToken=${sessionToken}`,
        },
      },
    );

    if (!res.ok) {
      cookie.delete("accessToken", { path: "/" });
      throw redirect(302, "/auth?from=" + encodeURIComponent(url.pathname));
    }

    const data = await res.json();
    const role = data?.user?.role;
    if (role !== "ADMIN") {
      cookie.delete("accessToken", { path: "/" });
      throw redirect(302, "/auth?from=" + encodeURIComponent(url.pathname));
    }
  } catch {
    if (!cookie.get("accessToken")?.value) {
      throw redirect(302, "/auth?from=" + encodeURIComponent(url.pathname));
    }
  }
};

export default component$(() => {
  return (
    <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <main class="flex min-w-0 flex-1 flex-col">
        <Slot />
      </main>
    </div>
  );
});
