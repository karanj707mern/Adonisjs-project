import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/lib/storage";
import { getProfile } from "~/lib/api/auth";
import { toast } from "~/lib/toast";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: "▦",
    description: "Dashboard summary",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "🧾",
    description: "Shipment queue",
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: "⛀",
    description: "Catalog & inventory",
  },
  {
    href: "/admin/new-arrivals",
    label: "New Arrivals & Hero",
    icon: "✨",
    description: "New arrivals & hero carousel",
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: "❝",
    description: "Returns & disputes",
  },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: "✎",
    description: "Wellness journal",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "⚙",
    description: "Store configuration",
  },
  {
    href: "/admin/gift-cards",
    label: "Gift Cards",
    icon: "🎟",
    description: "Issue and manage gift cards",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const open = useSignal(false);
  const collapsed = useSignal(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        class={`hidden lg:flex lg:flex-col shrink-0 border-r border-slate-200 bg-slate-50 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          collapsed.value ? "w-16 items-center py-4" : "w-72 px-4 py-6"
        }`}
      >
        <div
          class={`flex items-center gap-3 w-full ${
            collapsed.value ? "justify-center flex-col" : "px-2 pb-6"
          }`}
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-lg text-white">
            ❀
          </span>
          {!collapsed.value && (
            <div class="leading-tight min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Moringa Admin
              </p>
              <p class="text-xs text-slate-500">Management console</p>
            </div>
          )}
          {!collapsed.value && (
            <button
              type="button"
              onClick$={() => (collapsed.value = true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              class="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              ←
            </button>
          )}
          {collapsed.value && (
            <button
              type="button"
              onClick$={() => (collapsed.value = false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              class="mt-2 rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              →
            </button>
          )}
        </div>

        <nav class="flex flex-1 flex-col gap-2 w-full">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isActive(loc.url.pathname, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick$={() => (open.value = false)}
                aria-current={active ? "page" : undefined}
                class={`group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 select-none ${
                  active
                    ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${
                    active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed.value && (
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate">{item.label}</span>
                    {item.description && (
                      <span
                        class={`truncate text-xs font-normal ${
                          active
                            ? "text-emerald-800 dark:text-emerald-200"
                            : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </span>
                    )}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {open.value && (
        <div class="fixed inset-0 z-50 lg:hidden">
          <div
            class="absolute inset-0 bg-black/40"
            onClick$={() => (open.value = false)}
            aria-hidden="true"
          />
          <div class="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-slate-50 px-4 py-6 shadow-xl dark:bg-slate-900">
            <div class="flex items-center justify-between px-2 pb-6">
              <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-lg text-white">
                  ❀
                </span>
                <div class="leading-tight">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Moringa Admin
                  </p>
                  <p class="text-xs text-slate-500">Management console</p>
                </div>
              </div>
              <button
                type="button"
                onClick$={() => (open.value = false)}
                aria-label="Close navigation"
                class="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <nav aria-label="Admin" class="flex flex-col gap-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isActive(loc.url.pathname, item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick$={() => (open.value = false)}
                    aria-current={active ? "page" : undefined}
                    class={`group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 select-none ${
                      active
                        ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${
                        active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span class="flex min-w-0 flex-col">
                      <span class="truncate">{item.label}</span>
                      {item.description && (
                        <span class="truncate text-xs font-normal text-slate-500">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div class="flex items-center justify-between border-b border-slate-200 p-4 lg:hidden dark:border-slate-800">
        <button
          type="button"
          onClick$={() => (open.value = true)}
          aria-label="Open menu"
          class="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ☰
        </button>
        <p class="font-semibold text-slate-900 dark:text-slate-100">
          Moringa Admin
        </p>
        <a href="/" class="text-sm text-neon hover:underline">
          ← Store
        </a>
      </div>
    </>
  );
});
