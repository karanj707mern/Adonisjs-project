import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import {
  CART_CHANGED_EVENT,
  WISHLIST_CHANGED_EVENT,
  getCartCount,
  getWishlistCount,
  useCurrentUser,
} from "~/lib/storage";
import { getCart } from "~/lib/api/cart";
import { getWishlist } from "~/lib/api/wishlist";
import { signOutCurrentUser } from "~/lib/session";
import { SiteNav } from "./site-nav";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/blog", label: "Blog" },
  { href: "/gift-cards", label: "Gift Cards" },
];

export const MainNavbar = component$(() => {
  const cartCount = useSignal(0);
  const wishlistCount = useSignal(0);
  const user = useCurrentUser();
  const nav = useNavigate();

  const isLoggedIn = Boolean(user.user);
  const isAdmin = (user.user as Record<string, unknown> | null)?.role === "ADMIN";

  const refreshCartCount = $(async () => {
    if (isAdmin) {
      cartCount.value = 0;
      return;
    }

    try {
      const items = await getCart();
      const count = (items as Array<{ quantity?: number }>).reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0,
      );
      cartCount.value = count;
      return;
    } catch {
      // Fallback to browser storage only if the guest requests are unavailable.
    }

    cartCount.value = getCartCount();
  });

  const refreshWishlistCount = $(async () => {
    if (isAdmin) {
      wishlistCount.value = 0;
      return;
    }

    try {
      const items = await getWishlist();
      wishlistCount.value = (items as Array<unknown>).length;
      return;
    } catch {
      // Fallback to browser storage only if the guest requests are unavailable.
    }

    wishlistCount.value = getWishlistCount();
  });

  useVisibleTask$(() => {
    if (isAdmin) {
      cartCount.value = 0;
      wishlistCount.value = 0;
      return;
    }

    refreshCartCount();
    refreshWishlistCount();
  });

  useVisibleTask$(({ cleanup }) => {
    if (isAdmin) return;

    const handleCartChanged = $(() => {
      refreshCartCount();
    });

    const handleWishlistChanged = $(() => {
      refreshWishlistCount();
    });

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    window.addEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChanged);

    const handleVisibilityChange = $(() => {
      if (document.visibilityState === "visible") {
        refreshCartCount();
        refreshWishlistCount();
      }
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return cleanup(() => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      window.removeEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
  });

  const handleLogout = $(async () => {
    await signOutCurrentUser();
    cartCount.value = 0;
    wishlistCount.value = 0;
    nav("/auth");
  });

  return (
    <SiteNav
      cartCount={cartCount.value}
      wishlistCount={wishlistCount.value}
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      onLogout={handleLogout}
    />
  );
});
