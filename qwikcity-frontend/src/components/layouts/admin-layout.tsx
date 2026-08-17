import { component$, Slot, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/gift-cards", label: "Gift Cards" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/new-arrivals", label: "New Arrivals" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/settings", label: "Settings" },
];

export const AdminLayout = component$(() => {
  const user = useCurrentUser();
  const sidebarOpen = useSignal(false);
  const nav = useNavigate();

  return (
    <div class="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside
        class={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen.value ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0`}
      >
        <div class="mb-6 flex items-center gap-2 text-lg font-bold">
          <span class="inline-block h-5 w-5 rounded-full bg-neon" />
          Admin
        </div>
        <nav class="space-y-1">
          {ADMIN_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              class="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-neon dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div class="mt-6 space-y-1 border-t border-slate-200 pt-4 dark:border-slate-800">
          <a
            href="/"
            class="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-neon dark:text-slate-300"
          >
            View Store
          </a>
          <button
            type="button"
            class="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick$={async () => {
              await signOutCurrentUser();
              nav("/auth");
            }}
          >
            Sign Out{user.user ? ` (${(user.user as { user?: { name?: string } })?.user?.name ?? ""})` : ""}
          </button>
        </div>
      </aside>

      <div class="flex-1">
        <div class="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            class="rounded-md p-2"
            aria-label="Toggle sidebar"
            onClick$={() => (sidebarOpen.value = !sidebarOpen.value)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span class="font-semibold">Admin</span>
        </div>
        <div class="p-4 sm:p-6">
          <Slot />
        </div>
      </div>
    </div>
  );
});
