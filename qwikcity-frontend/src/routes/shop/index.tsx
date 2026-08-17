import { component$, useStore } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { Product } from "~/lib/types";
import { getProducts } from "~/lib/api/product";
import { ProductCard } from "~/components/ui/product-card";
import { ProductGridSkeleton } from "~/components/ui/skeleton";

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object" && Array.isArray((data as { products?: unknown }).products)) {
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
  const state = useStore({ query: "", sort: "featured" });

  const filtered = data.value.products
    .filter((p) => {
      const q = state.query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (state.sort === "price-asc") return a.price - b.price;
      if (state.sort === "price-desc") return b.price - a.price;
      return 0;
    });

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">Shop</h1>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search products..."
          class="input sm:max-w-xs"
          bind:value={state.query}
        />
        <select class="input sm:max-w-[200px]" bind:value={state.sort}>
          <option value="featured">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
        <span class="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {data.value.error ? (
        <p class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {data.value.error}
        </p>
      ) : filtered.length === 0 ? (
        <ProductGridSkeleton />
      ) : (
        <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
});
