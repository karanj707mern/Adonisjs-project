import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import {
  getCartCount,
  getWishlistCount,
  CART_CHANGED_EVENT,
  WISHLIST_CHANGED_EVENT,
  useCurrentUser,
} from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";
import { ThemeToggle } from "./theme-toggle";
import { Link } from "@builder.io/qwik-city";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/blog", label: "Blog" },
  { href: "/gift-cards", label: "Gift Cards" },
  { href: "/wellness-journal", label: "Wellness Journal" },
  { href: "/about-us", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const Header = component$(() => {
  const user = useCurrentUser();
  const cart = useStore({ count: 0 });
  const wishlist = useStore({ count: 0 });
  const menuOpen = useSignal(false);
  const userMenuOpen = useSignal(false);
  const searchQuery = useSignal("");
  const searchOpen = useSignal(false);
  const searchResults = useStore<{ items: Array<{ id: number | string; name: string; href: string }> }>({ items: [] });
  const searchLoading = useSignal(false);
  const loc = useLocation();
  const nav = useNavigate();
  const searchRef = useSignal<HTMLInputElement>();

  useVisibleTask$(() => {
    const syncCart = $(() => {
      cart.count = getCartCount();
    });
    const syncWishlist = $(() => {
      wishlist.count = getWishlistCount();
    });
    syncCart();
    syncWishlist();
    window.addEventListener(CART_CHANGED_EVENT, syncCart);
    window.addEventListener(WISHLIST_CHANGED_EVENT, syncWishlist);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, syncCart);
      window.removeEventListener(WISHLIST_CHANGED_EVENT, syncWishlist);
      window.removeEventListener("storage", syncCart);
    };
  });

  const handleSearch = useSignal<() => Promise<void>>(async () => {
    const q = searchQuery.value.trim();
    if (q.length < 2) {
      searchResults.items = [];
      return;
    }

    searchLoading.value = true;
    try {
      const { getProducts } = await import("~/lib/api/product");
      const data = await getProducts();
      const products = Array.isArray(data) ? data : (data as Record<string, unknown> & { products?: unknown[] })?.products ?? [];
      const qLower = q.toLowerCase();
      searchResults.items = products
        .filter(
          (p: Record<string, unknown>) =>
            String(p.name ?? p.title ?? "")
              .toLowerCase()
              .includes(qLower),
        )
        .slice(0, 6)
        .map((p: Record<string, unknown>) => ({
          id: p.id as number | string,
          name: String(p.name ?? p.title ?? "Product"),
          href: `/product/${p.id}`,
        }));
    } catch {
      searchResults.items = [];
    } finally {
      searchLoading.value = false;
    }
  });

  const navigateToSearch = $(() => {
    const q = searchQuery.value.trim();
    if (q) {
      nav(`/shop?q=${encodeURIComponent(q)}`);
      searchOpen.value = false;
      searchQuery.value = "";
      searchResults.items = [];
    }
  });

  const handleLogout = $(async () => {
    await signOutCurrentUser();
    cart.count = 0;
    wishlist.count = 0;
    nav("/auth");
  });

  return (
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <a
          href="/"
          class="flex items-center gap-2 text-lg font-bold tracking-tight"
          onClick$={() => nav("/")}
        >
          <span class="inline-block h-6 w-6 rounded-full bg-neon" />
          Moringa
        </a>

        <nav class="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              class={`rounded-md px-3 py-2 text-sm font-medium transition hover:text-neon ${
                isActiveSync(loc.url.pathname, link.href)
                  ? "text-neon"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div class="flex items-center gap-1">
          <div class="relative">
            <button
              type="button"
              class="rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
              aria-label="Search"
              onClick$={() => (searchOpen.value = !searchOpen.value)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {searchOpen.value && (
              <div class="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery.value}
                  onInput$={(_, el) => {
                    searchQuery.value = el.value;
                    handleSearch.value();
                  }}
                  onKeyDown$={(e) => {
                    if (e.key === "Enter") {
                      navigateToSearch();
                    }
                  }}
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-neon dark:border-slate-700 dark:bg-slate-800"
                />
                {searchLoading.value && (
                  <div class="mt-2 text-xs text-slate-400">Searching...</div>
                )}
                {!searchLoading.value && searchResults.items.length > 0 && (
                  <ul class="mt-2 max-h-60 overflow-auto">
                    {searchResults.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          onClick$={() => {
                            searchOpen.value = false;
                            searchQuery.value = "";
                            searchResults.items = [];
                          }}
                          class="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick$={navigateToSearch}
                  class="btn-primary mt-2 w-full text-sm"
                >
                  View all results
                </button>
              </div>
            )}
          </div>

          <a
            href="/wishlist"
            class="relative rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
            aria-label="Wishlist"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {wishlist.count > 0 && (
              <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-slate-950">
                {wishlist.count}
              </span>
            )}
          </a>

          <a
            href="/cart"
            class="relative rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
            aria-label="Cart"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {cart.count > 0 && (
              <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-slate-950">
                {cart.count}
              </span>
            )}
          </a>

          <div class="relative">
            <button
              type="button"
              class="rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
              aria-label="Account"
              aria-expanded={userMenuOpen.value}
              onClick$={() => (userMenuOpen.value = !userMenuOpen.value)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {userMenuOpen.value && !!user.user && (
              <div class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <span class="block px-4 py-2 text-xs text-slate-400">
                  {(() => {
                    const u = user.user as Record<string, unknown> | null;
                    const name = u?.user ? (u.user as Record<string, unknown>).name : undefined;
                    return (typeof name === "string" ? name : "Account") as string;
                  })()}
                </span>
                <a
                  href="/profile"
                  onClick$={() => (userMenuOpen.value = false)}
                  class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Profile
                </a>
                <button
                  type="button"
                  onClick$={async () => {
                    userMenuOpen.value = false;
                    await handleLogout();
                  }}
                  class="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  Logout
                </button>
              </div>
            )}

            {userMenuOpen.value && !user.user && (
              <div class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <a
                  href="/auth"
                  onClick$={() => (userMenuOpen.value = false)}
                  class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Login
                </a>
              </div>
            )}
          </div>

          <ThemeToggle />

          <button
            type="button"
            class="rounded-md p-2 text-slate-600 md:hidden dark:text-slate-300"
            aria-label="Toggle menu"
            onClick$={() => (menuOpen.value = !menuOpen.value)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen.value && (
        <nav class="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              class="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-neon dark:text-slate-300"
              onClick$={() => (menuOpen.value = false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
});

function isActiveSync(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
