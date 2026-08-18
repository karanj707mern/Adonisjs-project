import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { Product } from "~/lib/types";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees, normalizePrice } from "~/lib/formatters";
import { ProductCard } from "~/components/ui/product-card";

interface NewArrivalsCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: Record<string | number, boolean>;
  isAdmin: boolean;
  brokenImages: Record<string | number, boolean>;
  onImageError: (id: string | number) => void;
}

const CARD_GAP = 20;

function getVisibleCount(): number {
  if (typeof window === "undefined") return 3;
  const width = window.innerWidth;
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
}

export const NewArrivalsSection = component$<NewArrivalsCarouselProps>(
  ({
    products,
    onAddToCart,
    onToggleWishlist,
    wishlist,
    isAdmin,
    brokenImages,
    onImageError,
  }) => {
    const visibleCount = useSignal(getVisibleCount());
    const currentIndex = useSignal(0);

    useVisibleTask$(() => {
      const handleResize = $(() => {
        const next = getVisibleCount();
        visibleCount.value = next;
        currentIndex.value = Math.min(
          currentIndex.value,
          Math.max(0, products.length - next),
        );
      });

      handleResize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    });

    const maxIndex = Math.max(0, products.length - visibleCount.value);

    const scrollToIndex = $((index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, maxIndex));
      currentIndex.value = clampedIndex;

      const card = document.querySelector(
        `[data-carousel-index="${clampedIndex}"]`,
      ) as HTMLElement | null;
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = CARD_GAP;
      const scrollLeft = clampedIndex * (cardWidth + gap);

      card.parentElement?.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    });

    const handlePrev = $(() => {
      scrollToIndex(currentIndex.value - 1);
    });

    const handleNext = $(() => {
      scrollToIndex(currentIndex.value + 1);
    });

    if (products.length === 0) {
      return null;
    }

    return (
      <div class="mt-8">
        <div class="relative">
          <div
            id="new-arrivals-scroll"
            class="carousel-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
          >
            {products.map((product, index) => (
              <article
                key={product.id}
                data-carousel-index={index}
                class="group flex flex-col w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm transition hover:-translate-y-1 card"
              >
                <a
                  href={`/product/${product.id}`}
                  class="block"
                  onClick$={(event) => event.stopPropagation()}
                >
                  <span class="absolute left-4 top-4 z-10 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white shadow-sm">
                    New
                  </span>
                  <div class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-emerald-700 dark:text-emerald-300 shadow-sm backdrop-blur">
                    {product.stock > 0 ? "✓" : "✕"}
                  </div>
                  <img
                    src={
                      brokenImages[product.id]
                        ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f5f5f4'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a8a29e' font-family='sans-serif' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E"
                        : resolveImageUrl(product.image)
                    }
                    alt={product.name}
                    width={400}
                    height={300}
                    sizes="(max-width: 640px) 78vw, (max-width: 1280px) 50vw, 300px"
                    class="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError$={() => onImageError(product.id)}
                  />
                </a>
                <div class="flex flex-1 flex-col p-6">
                  <p class="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                    {formatRupees(normalizePrice(product.price || 0))}
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
                    <button
                      type="button"
                      onClick$={(event) => {
                        event.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      class={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition duration-200 ${
                        wishlist[product.id]
                          ? "border-rose-200 bg-rose-50 text-rose-600 dark:text-rose-400"
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-rose-200 hover:text-rose-600 dark:text-rose-400"
                      }`}
                      aria-label={
                        wishlist[product.id]
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={wishlist[product.id] ? "currentColor" : "none"}
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="h-4 w-4"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06 1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick$={(event) => {
                        event.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={isAdmin || product.stock <= 0}
                      class="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAdmin
                        ? "Admins cannot purchase"
                        : product.stock > 0
                          ? "Add to cart"
                          : "Out of stock"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {products.length > visibleCount.value ? (
            <>
              <span class="absolute left-20 top-1/2 z-10 hidden -translate-y-1/2 text-sm font-medium text-[var(--text-secondary)] sm:block">
                {currentIndex.value + 1}-
                {Math.min(
                  currentIndex.value + visibleCount.value,
                  products.length,
                )}{" "}
                of {products.length}
              </span>
              <button
                type="button"
                onClick$={handlePrev}
                disabled={currentIndex.value === 0}
                class="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 shadow-md transition hover:bg-[var(--bg-secondary)] disabled:opacity-40 sm:flex"
                aria-label="Previous new arrivals"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick$={handleNext}
                disabled={currentIndex.value >= maxIndex}
                class="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 shadow-md transition hover:bg-[var(--bg-secondary)] disabled:opacity-40 sm:flex"
                aria-label="Next new arrivals"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  },
);
