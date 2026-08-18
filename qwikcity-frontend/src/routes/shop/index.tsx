import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import {
  useCurrentUser,
  markAuthChecked,
  CART_CHANGED_EVENT,
  WISHLIST_CHANGED_EVENT,
} from "~/lib/storage";
import { getProducts } from "~/lib/api/product";
import { addCartItem as apiAddCartItem } from "~/lib/api/cart";
import { formatRupees, normalizePrice } from "~/lib/formatters";
import { toast } from "~/lib/toast";
import { ProductCard } from "~/components/ui/product-card";
import { ProductCardSkeleton } from "~/components/ui/skeleton";
import type { Product } from "~/lib/types";

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { products?: unknown }).products)
  ) {
    return (data as { products: Product[] }).products;
  }
  return [];
}

export const useShopData = routeLoader$(async () => {
  try {
    const data = await getProducts();
    return { products: normalizeProducts(data), error: "" };
  } catch (err) {
    return {
      products: [],
      error: err instanceof Error ? err.message : "Could not load products.",
    };
  }
});

export default component$(() => {
  const data = useShopData();
  const nav = useNavigate();
  const userStore = useCurrentUser();

  const isAdmin = useStore({ value: false });

  useVisibleTask$(() => {
    markAuthChecked();
    const user = userStore.user as { role?: string } | null;
    isAdmin.value = Boolean(user?.role === "ADMIN");
  });

  const state = useStore({
    query: "",
    availability: "all" as string,
    sort: "featured" as string,
  });

  const brokenImages = useStore<Record<string | number, boolean>>({});
  const wishlist = useStore<Record<string | number, boolean>>({});

  const handleImageError = $((id: string | number) => {
    brokenImages[id] = true;
  });

  const handleAddToCart = $(async (product: Product) => {
    const user = userStore.user as { role?: string } | null;
    if (user?.role === "ADMIN") {
      toast.error(
        "Admin accounts cannot add products to cart or place orders.",
      );
      return;
    }

    try {
      await apiAddCartItem(product.id, 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(CART_CHANGED_EVENT));
      }
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add item to cart.",
      );
    }
  });

  const handleToggleWishlist = $(async (product: Product) => {
    const user = userStore.user as { role?: string } | null;
    if (user?.role === "ADMIN") {
      return;
    }

    const productId = product.id;
    const wasWishlisted = Boolean(wishlist[productId]);

    try {
      if (wasWishlisted) {
        await removeWishlistItemLocal(productId);
        delete wishlist[productId];
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        toast.info("Removed from your wishlist.");
      } else {
        await addWishlistItemLocal(product);
        wishlist[productId] = true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        toast.success("Added to your wishlist.");
      }
    } catch {
      // ignore
    }
  });

  const storefrontProducts = isAdmin.value
    ? data.value.products
    : data.value.products.filter((p) => p.isActive !== false);

  const visibleProducts = storefrontProducts.filter((product) => {
    const q = state.query.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      `${product.name} ${product.description ?? ""} ${product.brand ?? ""} ${(product.tags ?? []).join(" ")}`
        .toLowerCase()
        .includes(q);

    const stock = product.stock ?? 0;
    const matchesAvailability =
      state.availability === "all" ||
      (state.availability === "in-stock" && stock > 0) ||
      (state.availability === "low-stock" && stock > 0 && stock <= 10) ||
      (state.availability === "out-of-stock" && stock <= 0);

    return matchesSearch && matchesAvailability;
  });

  const sortedProducts = [...visibleProducts].sort((a, b) => {
    if (state.sort === "price-low") return Number(a.price) - Number(b.price);
    if (state.sort === "price-high") return Number(b.price) - Number(a.price);
    if (state.sort === "name") return a.name.localeCompare(b.name);
    if (state.sort === "newest") {
      const aTime = new Date(
        (a as { createdAt?: string | number }).createdAt ?? 0,
      ).getTime();
      const bTime = new Date(
        (b as { createdAt?: string | number }).createdAt ?? 0,
      ).getTime();
      return bTime - aTime;
    }
    return 0;
  });

  const resetFilters = $(() => {
    state.query = "";
    state.availability = "all";
    state.sort = "featured";
  });

  return (
    <div class="bg-[var(--bg-primary)] pb-24 text-[var(--text-primary)] theme-transition">
      <main>
        <div class="container-page py-12">
          <section class="rounded-[2rem] bg-[linear-gradient(135deg,#0f5132,#1f7a4c,#d6f3dd)] p-8 text-white shadow-sm">
            <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              Catalog
            </p>
            <h1 class="mt-4 font-serif text-4xl sm:text-5xl">
              Find the right moringa format
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
              Search the catalog, compare availability, and sort the collection
              the way you would expect from a professional storefront.
            </p>
          </section>

          {data.value.error ? (
            <div class="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
              {data.value.error}
            </div>
          ) : null}

          <section class="mt-8 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8 card">
            <div class="grid gap-4 md:grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.8fr]">
              <div>
                <label
                  htmlFor="shopSearch"
                  class="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Search products
                </label>
                <input
                  id="shopSearch"
                  type="search"
                  placeholder="Search powders, teas, oils, capsules..."
                  class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                  value={state.query}
                  onInput$={(_, el) => (state.query = el.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="availability"
                  class="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Availability
                </label>
                <select
                  id="availability"
                  class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                  value={state.availability}
                  onChange$={(_, el) => (state.availability = el.value)}
                >
                  <option value="all">All products</option>
                  <option value="in-stock">In stock</option>
                  <option value="low-stock">Low stock</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="sortBy"
                  class="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Sort by
                </label>
                <select
                  id="sortBy"
                  class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                  value={state.sort}
                  onChange$={(_, el) => (state.sort = el.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <span>
                {sortedProducts.length} product
                {sortedProducts.length === 1 ? "" : "s"} matching your current
                view
              </span>
              <button
                type="button"
                onClick$={resetFilters}
                class="text-emerald-700 dark:text-emerald-300 transition hover:text-emerald-900 dark:hover:text-emerald-200"
              >
                Reset filters
              </button>
            </div>
          </section>

          {sortedProducts.length === 0 ? (
            <div class="mt-8 rounded-[2rem] border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] p-8 text-center text-[var(--text-secondary)] shadow-sm card">
              No products match your current filters.
            </div>
          ) : (
            <section class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <article
                  key={product.id}
                  class="flex flex-col overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm transition hover:-translate-y-1 card"
                >
                  <button
                    type="button"
                    onClick$={() => nav(`/product/${product.id}`)}
                    class="block w-full text-left"
                  >
                    <img
                      src={
                        brokenImages[product.id]
                          ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f5f5f4'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a8a29e' font-family='sans-serif' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E"
                          : product.image || ""
                      }
                      alt={product.name}
                      width={400}
                      height={300}
                      class="h-60 w-full object-cover"
                      loading="lazy"
                      onError$={() => handleImageError(product.id)}
                    />
                  </button>

                  <div class="flex flex-1 flex-col p-6">
                    <p class="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                      {formatRupees(normalizePrice(product.price))}
                    </p>
                    <h3 class="mt-2 text-xl font-semibold text-[var(--text-primary)] line-clamp-2">
                      {product.name}
                    </h3>
                    {product.compareAtPrice != null &&
                    product.compareAtPrice > product.price ? (
                      <p class="mt-1 text-sm text-[var(--text-muted)] line-through">
                        {formatRupees(normalizePrice(product.compareAtPrice))}
                      </p>
                    ) : null}
                    <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-2">
                      {product.description ?? ""}
                    </p>
                    <div class="mt-auto flex items-center gap-2 pt-4">
                      <span
                        class={`rounded-full px-3 py-1 text-xs font-medium ${
                          (product.stock ?? 0) <= 0
                            ? "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                            : (product.stock ?? 0) <= 10
                              ? "bg-[var(--warning-bg)] text-[var(--warning-text)]"
                              : "bg-[var(--success-bg)] text-[var(--success-text)]"
                        }`}
                      >
                        {(product.stock ?? 0) <= 0
                          ? "Out of stock"
                          : (product.stock ?? 0) <= 10
                            ? `Only ${product.stock} left`
                            : "In stock"}
                      </span>
                      <button
                        type="button"
                        onClick$={() => handleToggleWishlist(product)}
                        class={`ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border transition duration-200 ${
                          Boolean(wishlist[product.id])
                            ? "border-rose-200 bg-rose-50 text-rose-600 dark:text-rose-400"
                            : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-rose-200 hover:text-rose-600 dark:text-rose-400"
                        }`}
                        aria-label={
                          Boolean(wishlist[product.id])
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={
                            Boolean(wishlist[product.id])
                              ? "currentColor"
                              : "none"
                          }
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="h-4 w-4"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.78 1.06 1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick$={() => handleAddToCart(product)}
                        disabled={isAdmin.value || (product.stock ?? 0) <= 0}
                        class="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAdmin.value
                          ? "Admins cannot purchase"
                          : (product.stock ?? 0) > 0
                            ? "Add to cart"
                            : "Out of stock"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
});

async function removeWishlistItemLocal(
  productId: string | number,
): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("wishlist-items");
      if (!stored) return;
      const items = JSON.parse(stored);
      const next = Array.isArray(items)
        ? items.filter((item: { id: string | number }) => item.id !== productId)
        : [];
      localStorage.setItem("wishlist-items", JSON.stringify(next));
    } catch {
      localStorage.removeItem("wishlist-items");
    }
  }
}

async function addWishlistItemLocal(product: Product): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("wishlist-items");
      const raw = stored ?? "[]";
      const items = JSON.parse(raw);
      const list = Array.isArray(items) ? items : [];
      const exists = list.some(
        (item: { id: string | number }) => item.id === product.id,
      );
      if (!exists) {
        list.push({ ...product, quantity: 1 });
        localStorage.setItem("wishlist-items", JSON.stringify(list));
      }
    } catch {
      localStorage.setItem(
        "wishlist-items",
        JSON.stringify([{ ...product, quantity: 1 }]),
      );
    }
  }
}
