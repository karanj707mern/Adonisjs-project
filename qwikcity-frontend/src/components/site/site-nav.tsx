import { component$, useSignal, useVisibleTask$, type QRL } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { useTheme } from "~/components/theme-provider";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/blog", label: "Blog" },
  { href: "/gift-cards", label: "Gift Cards" },
];

type SiteNavProps = {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onLogout?: () => Promise<void>;
};

export const SiteNav = component$<SiteNavProps>((props) => {
  const loc = useLocation();
  const { theme, toggleTheme } = useTheme();
  const menuOpen = useSignal(false);

  useVisibleTask$(() => {
    menuOpen.value = false;
  });

  const pathname = loc.url.pathname;

  const isActive: Record<string, boolean> = {};
  for (const item of NAV_ITEMS) {
    if (item.href === "/shop") {
      isActive[item.href] =
        pathname === "/shop" || pathname.startsWith("/product");
    } else {
      isActive[item.href] =
        pathname === item.href || pathname.startsWith(item.href + "/");
    }
  }

  return (
    <nav
      aria-label="Main"
      class="sticky top-0 z-30 border-y border-[var(--border-strong)] bg-[var(--bg-secondary)] pt-[env(safe-area-inset-top)]"
      style={{ isolation: "isolate" }}
    >
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-3 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-6 lg:px-10">
        <div class="min-w-0 flex-shrink">
          <Link
            href="/"
            aria-label="Moringa Store Online homepage"
            class="group block font-serif text-[1.35rem] text-[var(--text-primary)] transition-all duration-300 hover:scale-[1.03] hover:text-emerald-700 md:text-[1.9rem] dark:hover:text-emerald-300"
          >
            <span class="relative inline-flex items-center gap-2">
              <span class="relative whitespace-nowrap">
                Moringa Store Online
                <span class="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-emerald-600 transition-transform duration-300 group-hover:scale-x-100 dark:bg-emerald-400" />
              </span>
              <span class="self-center opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                <svg
                  viewBox="0 0 220 64"
                  fill="none"
                  class="h-6 w-auto text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                >
                  <path
                    d="M4 52 L4 12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <ellipse
                    cx="12"
                    cy="14"
                    rx="4"
                    ry="7.5"
                    fill="currentColor"
                    transform="rotate(-15 12 14)"
                  />
                  <ellipse
                    cx="12"
                    cy="38"
                    rx="4"
                    ry="7.5"
                    fill="currentColor"
                    transform="rotate(15 12 38)"
                  />
                  <ellipse cx="4" cy="26" rx="4" ry="7.5" fill="currentColor" />
                  <ellipse
                    cx="22"
                    cy="10"
                    rx="3.6"
                    ry="6.8"
                    fill="currentColor"
                    transform="rotate(-10 22 10)"
                  />
                  <ellipse
                    cx="22"
                    cy="42"
                    rx="3.6"
                    ry="6.8"
                    fill="currentColor"
                    transform="rotate(10 22 42)"
                  />
                  <ellipse
                    cx="34"
                    cy="8"
                    rx="3.2"
                    ry="6"
                    fill="currentColor"
                    transform="rotate(-8 34 8)"
                  />
                  <ellipse
                    cx="34"
                    cy="44"
                    rx="3.2"
                    ry="6"
                    fill="currentColor"
                    transform="rotate(8 34 44)"
                  />
                  <ellipse
                    cx="46"
                    cy="7"
                    rx="2.8"
                    ry="5.2"
                    fill="currentColor"
                    transform="rotate(-6 46 7)"
                  />
                  <ellipse
                    cx="46"
                    cy="45"
                    rx="2.8"
                    ry="5.2"
                    fill="currentColor"
                    transform="rotate(6 46 45)"
                  />
                  <ellipse
                    cx="58"
                    cy="8"
                    rx="2.4"
                    ry="4.4"
                    fill="currentColor"
                    transform="rotate(-5 58 8)"
                  />
                  <ellipse
                    cx="58"
                    cy="44"
                    rx="2.4"
                    ry="4.4"
                    fill="currentColor"
                    transform="rotate(5 58 44)"
                  />
                  <ellipse
                    cx="70"
                    cy="10"
                    rx="2"
                    ry="3.6"
                    fill="currentColor"
                    transform="rotate(-4 70 10)"
                  />
                  <ellipse
                    cx="70"
                    cy="42"
                    rx="2"
                    ry="3.6"
                    fill="currentColor"
                    transform="rotate(4 70 42)"
                  />
                </svg>
              </span>
            </span>
          </Link>
          <p class="text-sm uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-all duration-300 group-hover:text-emerald-700 md:tracking-[0.16em] dark:hover:text-emerald-300">
            Your Natural Health Partner
          </p>
        </div>

        <div class="flex w-full items-center justify-between md:w-auto md:justify-end md:hidden">
          <button
            type="button"
            onClick$={() => (menuOpen.value = !menuOpen.value)}
            aria-label={menuOpen.value ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen.value}
            class="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-6 w-6"
              aria-hidden="true"
            >
              {menuOpen.value ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div class="hidden md:flex flex-shrink flex-nowrap items-center justify-end gap-2">
          <NavLinks
            isAdmin={props.isAdmin}
            pathname={pathname}
            isLoggedIn={props.isLoggedIn}
            onLogout={props.onLogout}
            theme={theme}
            toggleTheme={toggleTheme}
            cartCount={props.cartCount}
            wishlistCount={props.wishlistCount}
            isActive={isActive}
          />
        </div>
      </div>

      {menuOpen.value && (
        <div class="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 pb-4 pt-2">
          <div class="flex flex-col gap-3">
            <NavLinks
              isAdmin={props.isAdmin}
              pathname={pathname}
              isLoggedIn={props.isLoggedIn}
              onLogout={props.onLogout}
              theme={theme}
              toggleTheme={toggleTheme}
              cartCount={props.cartCount}
              wishlistCount={props.wishlistCount}
              isActive={isActive}
            />
          </div>
        </div>
      )}
    </nav>
  );
});

type NavLinksProps = {
  isAdmin?: boolean;
  pathname: string;
  isLoggedIn: boolean;
  onLogout?: () => Promise<void>;
  theme: string;
  toggleTheme: QRL<() => void>;
  cartCount: number;
  wishlistCount: number;
  isActive: Record<string, boolean>;
};

const NavLinks = component$<NavLinksProps>((props) => {
  if (props.isAdmin) {
    return (
      <>
        <Link
          href="/admin"
          aria-current={props.pathname.startsWith("/admin") ? "page" : undefined}
          class="btn-nav"
        >
          Admin panel
        </Link>

        {props.isLoggedIn ? (
          <button
            type="button"
            onClick$={props.onLogout}
            class="btn-nav"
          >
            Logout
          </button>
        ) : (
          <Link href="/auth" class="btn-nav-wide">
            Admin login
          </Link>
        )}

        <button
          type="button"
          onClick$={props.toggleTheme}
          aria-label={`Switch to ${props.theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${props.theme === "light" ? "dark" : "light"} mode`}
          class="btn-nav"
        >
          {props.theme === "light" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          Theme
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/shop"
        aria-current={
          props.pathname === "/shop" || props.pathname.startsWith("/product")
            ? "page"
            : undefined
        }
        class="btn-nav whitespace-nowrap"
      >
        Shop
      </Link>

      <Link
        href="/cart"
        aria-current={props.pathname === "/cart" ? "page" : undefined}
        class="btn-nav whitespace-nowrap"
      >
        <span class="btn-nav-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span class="sr-only">Cart</span>
        <span
          class={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none ${
            props.cartCount > 0
              ? "bg-white text-emerald-950 shadow-sm"
              : "bg-emerald-950/60 text-emerald-50"
          }`}
        >
          {props.cartCount}
        </span>
      </Link>

      {NAV_ITEMS.map((item) => {
        const active = props.isActive[item.href];
        if (item.href === "/shop") return null;
        if (item.href === "/wishlist") {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              class="btn-nav whitespace-nowrap"
            >
              <span class="btn-nav-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </span>
              <span class="sr-only">Wishlist</span>
              <span
                class={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none ${
                  props.wishlistCount > 0
                    ? "bg-white text-emerald-950 shadow-sm"
                    : "bg-emerald-950/60 text-emerald-50"
                }`}
              >
                {props.wishlistCount}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            class="btn-nav whitespace-nowrap"
          >
            {item.label}
          </Link>
        );
      })}

      {props.isAdmin ? (
        <Link
          href="/admin"
          aria-current={props.pathname.startsWith("/admin") ? "page" : undefined}
          class="btn-nav whitespace-nowrap"
        >
          Admin panel
        </Link>
      ) : null}

      {props.isLoggedIn ? (
        <Link
          href="/profile"
          aria-current={props.pathname === "/profile" ? "page" : undefined}
          class="btn-nav whitespace-nowrap"
        >
          <span class="btn-nav-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span class="hidden sm:inline">Profile</span>
        </Link>
      ) : null}

      {props.isLoggedIn ? (
        <button
          type="button"
          onClick$={props.onLogout}
          class="btn-nav whitespace-nowrap"
        >
          Logout
        </button>
      ) : (
        <Link
          href="/auth"
          aria-current={props.pathname === "/auth" ? "page" : undefined}
          class="btn-nav-wide whitespace-nowrap"
        >
          Login
        </Link>
      )}

      <button
        type="button"
        onClick$={props.toggleTheme}
        aria-label={`Switch to ${props.theme === "light" ? "dark" : "light"} mode`}
        title={`Switch to ${props.theme === "light" ? "dark" : "light"} mode`}
        class="btn-nav whitespace-nowrap"
      >
        {props.theme === "light" ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
        Theme
      </button>
    </>
  );
});
