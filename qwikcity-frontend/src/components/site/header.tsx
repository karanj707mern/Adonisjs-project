import {
  component$,
  useStore,
  useVisibleTask$,
  useSignal,
} from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/lib/storage";
import { getCartCount, getWishlistCount, CART_CHANGED_EVENT, WISHLIST_CHANGED_EVENT } from "~/lib/storage";
import { ThemeToggle } from "./theme-toggle";

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
  const loc = useLocation();
  const nav = useNavigate();

  useVisibleTask$(() => {
    const syncCart = () => {
      cart.count = getCartCount();
    };
    const syncWishlist = () => {
      wishlist.count = getWishlistCount();
    };
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
                isActiveSync(loc.url.pathname, link.href) ? "text-neon" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div class="flex items-center gap-1">
          <a
            href="/wishlist"
            class="relative rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
            aria-label="Wishlist"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

          <a
            href={user.user ? "/profile" : "/auth"}
            class="rounded-md p-2 text-slate-600 transition hover:text-neon dark:text-slate-300"
            aria-label="Account"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </a>

          <ThemeToggle />

          <button
            type="button"
            class="rounded-md p-2 text-slate-600 md:hidden dark:text-slate-300"
            aria-label="Toggle menu"
            onClick$={() => (menuOpen.value = !menuOpen.value)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
