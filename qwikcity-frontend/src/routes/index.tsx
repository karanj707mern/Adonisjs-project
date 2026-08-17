import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { Product } from "~/lib/types";
import { getProducts } from "~/lib/api/product";
import { getFirstActiveHeroImage } from "~/lib/api/hero";
import { ProductCard } from "~/components/ui/product-card";
import { ProductGridSkeleton } from "~/components/ui/skeleton";

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (data && typeof data === "object" && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: Product[] }).products;
  }
  return [];
}

export const useHomeData = routeLoader$(async () => {
  let heroImage = "/images/home-hero-1.webp";
  let products: Product[] = [];
  let error = "";

  try {
    const firstHero = await getFirstActiveHeroImage();
    if (firstHero && typeof firstHero === "object" && "url" in firstHero && (firstHero as { url?: string }).url) {
      heroImage = (firstHero as { url: string }).url;
    }
  } catch {
    /* keep fallback */
  }

  try {
    const data = await getProducts();
    products = normalizeProducts(data).slice(0, 8);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load products.";
  }

  return { heroImage, products, error };
});

export default component$(() => {
  const data = useHomeData();

  return (
    <div>
      <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <img
          src={data.value.heroImage}
          alt="Moringa wellness"
          class="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div class="container-page relative flex flex-col items-start gap-4 py-20 lg:py-28">
          <span class="rounded-full bg-neon/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neon">
            Pure moringa wellness
          </span>
          <h1 class="max-w-2xl text-4xl font-extrabold leading-tight lg:text-6xl">
            Nourish your body with the power of Moringa
          </h1>
          <p class="max-w-xl text-slate-200">
            Premium, sustainably sourced moringa products — powders, teas, oils and more.
          </p>
          <div class="mt-2 flex gap-3">
            <a href="/shop" class="btn-primary">Shop now</a>
            <a href="/about-us" class="btn-ghost text-white">Learn more</a>
          </div>
        </div>
      </section>

      <section class="container-page py-12">
        <div class="mb-6 flex items-end justify-between">
          <h2 class="text-2xl font-bold">Featured products</h2>
          <a href="/shop" class="text-sm font-medium text-neon hover:underline">View all</a>
        </div>

        {data.value.error ? (
          <p class="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {data.value.error}
          </p>
        ) : data.value.products.length === 0 ? (
          <ProductGridSkeleton />
        ) : (
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.value.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section class="container-page grid gap-6 pb-16 sm:grid-cols-3">
        {[
          { title: "Sustainably sourced", body: "Ethically farmed moringa leaves, minimally processed to lock in nutrients." },
          { title: "Lab tested", body: "Every batch is tested for purity, potency and freshness." },
          { title: "Fast shipping", body: "Reliable delivery across India with tracking on every order." },
        ].map((feature) => (
          <div key={feature.title} class="card p-6">
            <div class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neon/15 text-neon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 class="font-semibold">{feature.title}</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{feature.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
});
