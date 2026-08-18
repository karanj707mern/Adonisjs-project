import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import {
  useCurrentUser,
  markAuthChecked,
  CART_CHANGED_EVENT,
  WISHLIST_CHANGED_EVENT,
  addWishlistItem,
  removeWishlistItem,
} from "~/lib/storage";
import { getProducts, getNewArrivals } from "~/lib/api/product";
import { getFirstActiveHeroImage } from "~/lib/api/hero";
import { getFeaturedReviews } from "~/lib/api/review";
import { getActiveNewArrivalImages } from "~/lib/api/new-arrival";
import { addCartItem as apiAddCartItem } from "~/lib/api/cart";
import { toast } from "~/lib/toast";
import { ProductCard } from "~/components/ui/product-card";
import { ProductCardSkeleton } from "~/components/ui/skeleton";
import { StatsSection } from "~/components/home/stats-section";
import { ReviewsSection } from "~/components/home/reviews-section";
import { TestimonialsSection } from "~/components/home/testimonials-section";
import { UpcomingProductsSection } from "~/components/home/upcoming-products-section";
import { NewArrivalsSection } from "~/components/home/new-arrivals-section";
import { NewArrivalsImageCarousel } from "~/components/home/new-arrivals-image-carousel";
import { Header } from "~/components/home/header";
import type { Product, Review } from "~/lib/types";

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

function normalizeReviews(data: unknown): Review[] {
  if (Array.isArray(data)) return data as Review[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { reviews?: unknown }).reviews)
  ) {
    return (data as { reviews: Review[] }).reviews;
  }
  return [];
}

export const useHomeData = routeLoader$(async () => {
  let heroImage = "/images/home-hero-1.webp";
  let products: Product[] = [];
  let newArrivals: Product[] = [];
  let newArrivalImages: {
    id: string | number;
    url: string;
    alt: string | null;
  }[] = [];
  let featuredReviews: Review[] = [];
  let error = "";

  try {
    const firstHero = await getFirstActiveHeroImage();
    if (
      firstHero &&
      typeof firstHero === "object" &&
      "url" in firstHero &&
      (firstHero as { url?: string }).url
    ) {
      heroImage = (firstHero as { url: string }).url;
    }
  } catch {
    /* keep fallback */
  }

  try {
    const [prodResult, arrivalsResult, reviewsResult] =
      await Promise.allSettled([
        getProducts(),
        getNewArrivals(),
        getFeaturedReviews(),
      ]);

    if (prodResult.status === "fulfilled") {
      products = normalizeProducts(prodResult.value).slice(0, 8);
    }
    if (arrivalsResult.status === "fulfilled") {
      newArrivals = normalizeProducts(arrivalsResult.value).slice(0, 4);
    }
    if (reviewsResult.status === "fulfilled") {
      featuredReviews = normalizeReviews(reviewsResult.value).slice(0, 5);
    }

    try {
      const imagesResult = await getActiveNewArrivalImages();
      if (Array.isArray(imagesResult)) {
        newArrivalImages = imagesResult as {
          id: string | number;
          url: string;
          alt: string | null;
        }[];
      }
    } catch {
      /* images optional */
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load home data.";
  }

  return {
    heroImage,
    products,
    newArrivals,
    newArrivalImages,
    featuredReviews,
    error,
  };
});

export default component$(() => {
  const data = useHomeData();
  const userStore = useCurrentUser();

  const isAdmin = useStore({ value: false });

  useVisibleTask$(() => {
    markAuthChecked();
    const user = userStore.user as { role?: string } | null;
    isAdmin.value = Boolean(user?.role === "ADMIN");
  });

  const brokenImages = useStore<Record<string | number, boolean>>({});
  const wishlist = useStore<Record<string | number, boolean>>({});
  const testimonialIndex = useSignal(0);
  const reviewIndex = useSignal(0);
  const productsLoading = useSignal(true);

  useVisibleTask$(() => {
    productsLoading.value = false;
  });

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
        await removeWishlistItem(productId);
        delete wishlist[productId];
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        toast.info("Removed from your wishlist.");
      } else {
        await addWishlistItem(product as unknown as Record<string, unknown>);
        wishlist[productId] = true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        toast.success("Added to your wishlist.");
      }
    } catch {
      // ignore wishlist toggle errors
    }
  });

  const upcomingProducts = data.value.products.filter(
    (p) => p.isActive === false,
  );

  return (
    <div class="bg-[var(--bg-primary)] pb-24 text-[var(--text-primary)] theme-transition">
      <main>
        <Header />

        <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div class="rounded-[2rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-left sm:text-left">
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                  Rewards
                </p>
                <h3 class="mt-2 font-serif text-xl text-[var(--text-primary)] sm:text-2xl">
                  Earn points with every purchase
                </h3>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">
                  Sign in to earn 1 point per ₹1 spent. Redeem points for
                  discounts on future orders.
                </p>
              </div>
              <div class="mt-4 sm:mt-0">
                <a
                  href="/auth?from=%2F&authMessage=Sign%20in%20to%20start%20earning%20rewards."
                  class="btn-primary whitespace-nowrap"
                >
                  Start earning
                </a>
              </div>
            </div>
          </div>
        </section>

        <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-[2rem] bg-emerald-900 px-8 py-10 text-white shadow-lg">
              <p class="text-sm uppercase tracking-[0.18em] text-emerald-200">
                Why This Store Works
              </p>
              <h2 class="mt-4 font-serif text-4xl leading-tight">
                A gentle storefront that converts when buyers are ready
              </h2>
              <p class="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90">
                Explore moringa essentials at your own pace, compare formats,
                and choose the products that fit your daily routine best.
              </p>
            </div>

            <StatsSection />
          </div>
        </section>

        <section
          id="products"
          class="bg-gradient-to-b from-[var(--bg-primary)] via-emerald-50/40 to-[var(--bg-primary)] dark:from-[var(--bg-primary)] dark:via-emerald-900/20 dark:to-[var(--bg-primary)]"
        >
          <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
            <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                  Store
                </p>
                <span class="hidden sm:inline text-emerald-400/60">—</span>
                <h2 class="font-serif text-3xl text-[var(--text-primary)] sm:text-4xl">
                  Browse a fuller moringa collection
                </h2>
              </div>

              <p class="max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                Explore teas, powders, oils, capsules, and curated bundles
                designed for everyday wellness routines.
              </p>
            </div>

            <div class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {productsLoading.value
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                : data.value.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={Boolean(wishlist[product.id])}
                      isAdmin={isAdmin.value}
                      brokenImages={brokenImages}
                      onImageError={handleImageError}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
            </div>
          </div>
        </section>

        {data.value.newArrivalImages.length > 0 ? (
          <section class="bg-gradient-to-b from-[var(--bg-primary)] via-emerald-50/40 to-[var(--bg-primary)] dark:from-[var(--bg-primary)] dark:via-emerald-900/20 dark:to-[var(--bg-primary)]">
            <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
              <NewArrivalsImageCarousel images={data.value.newArrivalImages} />
            </div>
          </section>
        ) : data.value.newArrivals.length > 0 ? (
          <section class="bg-gradient-to-b from-[var(--bg-primary)] via-emerald-50/40 to-[var(--bg-primary)] dark:from-[var(--bg-primary)] dark:via-emerald-900/20 dark:to-[var(--bg-primary)]">
            <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
              <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                    Just landed
                  </p>
                  <span class="hidden sm:inline text-emerald-400/60">—</span>
                  <h2 class="font-serif text-3xl text-[var(--text-primary)] sm:text-4xl">
                    New arrivals
                  </h2>
                  <p class="max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                    Fresh additions to the wellness shelf — thoughtfully sourced
                    and ready to become part of your daily routine.
                  </p>
                </div>
              </div>

              <NewArrivalsSection
                products={data.value.newArrivals}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
                isAdmin={isAdmin.value}
                brokenImages={brokenImages}
                onImageError={handleImageError}
              />
            </div>
          </section>
        ) : null}

        {upcomingProducts.length > 0 ? (
          <UpcomingProductsSection
            upcomingProducts={upcomingProducts}
            brokenImages={brokenImages}
            onImageError={handleImageError}
          />
        ) : null}

        <ReviewsSection
          reviewIndex={reviewIndex.value}
          featuredReviews={data.value.featuredReviews}
          onReviewIndexChange$={(index: number) => {
            reviewIndex.value = index;
          }}
        />

        <TestimonialsSection
          testimonialIndex={testimonialIndex.value}
          onTestimonialIndexChange$={(index: number) => {
            testimonialIndex.value = index;
          }}
        />
      </main>
    </div>
  );
});
