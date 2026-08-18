import { component$, Slot, useSignal, $ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";
import { ThemeToggle } from "~/components/site/theme-toggle";

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
  const sidebarCollapsed = useSignal(false);
  const nav = useNavigate();
  const loc = useLocation();
  const isAdmin = (user.user as Record<string, unknown> | null)?.role === "ADMIN";

  const handlePreview = $(() => {
    nav("/");
  });

  const handleExitPreview = $(() => {
    nav("/admin");
  });

  if (!isAdmin) {
    return (
      <div class="flex min-h-screen items-center justify-center">
        <div class="text-center">
          <h1 class="font-serif text-2xl">Access Denied</h1>
          <p class="mt-2 text-slate-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div class="theme-transition flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <aside
        class={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-transform duration-300 ${
          sidebarOpen.value ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div class="mb-6 flex items-center gap-2 text-lg font-bold">
          <span class="inline-block h-5 w-5 rounded-full bg-neon" />
          Moringa Admin
        </div>
        <nav class="space-y-1">
          {ADMIN_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              class={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                loc.url.pathname === link.href ||
                (link.exact ? false : loc.url.pathname.startsWith(link.href + "/"))
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div class="mt-6 space-y-1 border-t border-[var(--border-color)] pt-4">
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
            Sign Out
            {user.user
              ? (() => {
                  const u = user.user as Record<string, unknown>;
                  const nested = u?.user as Record<string, unknown> | undefined;
                  const name = nested?.name as string | undefined;
                  return ` (${name ?? ""})`;
                })()
              : ""}
          </button>
        </div>
      </aside>

      <div class="theme-transition flex min-w-0 flex-1 flex-col transition-all duration-300">
        <header class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/95 px-4 backdrop-blur lg:px-10">
          <div class="flex items-center gap-3">
            <button
              type="button"
              onClick$={() => (sidebarOpen.value = true)}
              aria-label="Open navigation"
              class="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] lg:hidden"
            >
              <span class="block h-0.5 w-5 bg-current" />
              <span class="mt-1 block h-0.5 w-5 bg-current" />
              <span class="mt-1 block h-0.5 w-5 bg-current" />
            </button>
            <p class="text-sm font-semibold text-[var(--text-primary)] lg:hidden">
              Moringa Admin
            </p>
          </div>

          <div class="flex items-center gap-2">
            <ThemeToggle />
            {loc.url.pathname === "/admin" ? (
              <button
                type="button"
                onClick$={handlePreview}
                class="btn-vibrant inline-flex items-center gap-2 rounded-full border-2 border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                aria-label="Preview store"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width={2.2}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview Website
              </button>
            ) : (
              <button
                type="button"
                onClick$={handleExitPreview}
                class="btn-vibrant inline-flex items-center gap-2 rounded-full border-2 border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                aria-label="Exit preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width={2.2}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Exit Preview
              </button>
            )}
          </div>
        </header>

        <main class="theme-transition min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 pt-[env(safe-area-inset-top)]">
          <div class="mx-auto max-w-6xl">
            <Slot />
          </div>
        </main>
      </div>
    </div>
  );
});
