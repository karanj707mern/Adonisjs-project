import { component$, useSignal } from "@builder.io/qwik";
import type { Product } from "~/lib/types";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees, normalizePrice, renderStars } from "~/lib/formatters";
import { ProductCard } from "~/components/ui/product-card";

export interface ProductDetailsInfoProps {
  product: Product;
  reviewSummary: { averageRating: number; reviewCount: number };
  isAdmin: boolean;
  isAddingToCart: boolean;
  isWishlisted: boolean;
  quantity: number;
  relatedProducts: Product[];
  brokenImages: Record<string | number, boolean>;
  onImageError: (id: string | number) => void;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  onQuantityChange: (value: number) => void;
}

export const ProductDetailsInfo = component$<ProductDetailsInfoProps>(
  ({
    product,
    reviewSummary,
    isAdmin,
    isAddingToCart,
    isWishlisted,
    quantity,
    relatedProducts,
    brokenImages,
    onImageError,
    onAddToCart,
    onToggleWishlist,
    onQuantityChange,
  }) => {
    const thumbnails = useSignal<string[]>([]);

    if (typeof window !== "undefined" && thumbnails.value.length === 0) {
      const images = [product.image].filter(Boolean);
      thumbnails.value = images.map((img) => resolveImageUrl(img as string));
    }

    const getAvailabilityLabel = (stock: number): string => {
      if (stock <= 0) return "Out of stock";
      if (stock <= 10) return "Limited stock";
      return "In stock";
    };

    const getShippingMessage = (stock: number): string => {
      if (stock <= 0) return "Ships when inventory is replenished";
      return "Dispatches in 1-2 business days";
    };

    return (
      <section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm card">
          {thumbnails.value.length > 0 ? (
            <img
              src={
                brokenImages[product.id]
                  ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23f5f5f4'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a8a29e' font-family='sans-serif' font-size='16'%3EImage unavailable%3C/text%3E%3C/svg%3E"
                  : thumbnails.value[0]
              }
              alt={product.name}
              class="h-full min-h-[300px] w-full object-cover sm:min-h-[420px]"
              onError$={() => onImageError(product.id)}
            />
          ) : (
            <div class="flex h-full min-h-[300px] items-center justify-center sm:min-h-[420px]">
              <span class="text-sm text-[var(--text-muted)]">
                No image available
              </span>
            </div>
          )}
        </div>

        <div class="rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8 card">
          <p class="text-sm uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Product Overview
          </p>
          <h1 class="mt-4 font-serif text-3xl text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>
          <p class="mt-4 text-xl font-semibold text-[var(--text-primary)]">
            {formatRupees(normalizePrice(product.price))}
          </p>
          {Number(product.compareAtPrice) > Number(product.price) ? (
            <p class="mt-2 text-sm text-[var(--text-muted)] line-through">
              {formatRupees(normalizePrice(product.compareAtPrice as number))}
            </p>
          ) : null}
          <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
            <span class="text-lg tracking-[0.18em] text-amber-500 dark:text-amber-300">
              {renderStars(Math.round(reviewSummary.averageRating))}
            </span>
            <span>
              {reviewSummary.averageRating > 0
                ? `${reviewSummary.averageRating.toFixed(1)}/5 from ${reviewSummary.reviewCount} review${reviewSummary.reviewCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>
          <p class="mt-6 text-base leading-8 text-[var(--text-secondary)]">
            {product.description}
          </p>
          {product.brand || product.sku ? (
            <div class="mt-4 flex flex-wrap gap-3 text-sm uppercase tracking-[0.1em] text-[var(--text-muted)]">
              {product.brand ? <span key="brand">{product.brand}</span> : null}
              {product.sku ? <span key="sku">{product.sku}</span> : null}
            </div>
          ) : null}

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
              <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Availability
              </p>
              <p class="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                {getAvailabilityLabel(product.stock)}
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {product.stock > 0
                  ? `${product.stock} units currently available`
                  : "Currently unavailable for purchase"}
              </p>
            </div>

            <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
              <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Delivery
              </p>
              <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                {getShippingMessage(product.stock)}
              </p>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Standard shipping rates are calculated at checkout.
              </p>
            </div>
          </div>

          <div class="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 card">
            <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
              Why customers buy this
            </p>
            <div class="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              {product.tags && product.tags.length > 0
                ? product.tags.map((tag) => <p key={tag}>{tag}</p>)
                : [
                    "Easy to enjoy as part of a calm daily routine",
                    "Simple to mix into smoothies, juices, or recipes",
                    "Convenient format for on-the-go wellness habits",
                    "Suitable for self-care and beauty-focused routines",
                    "Great for first-time buyers who want a fuller set",
                    "Plant-based moringa product from the core store collection",
                  ].map((highlight) => <p key={highlight}>{highlight}</p>)}
            </div>
          </div>

          {product.tags && product.tags.length > 0 ? (
            <div class="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  class="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-sm uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div class="mt-8 flex flex-wrap items-center gap-3">
            {!isAdmin ? (
              <div class="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <button
                  type="button"
                  class="px-3 py-2"
                  aria-label="Decrease quantity"
                  onClick$={() => onQuantityChange(Math.max(1, quantity - 1))}
                >
                  −
                </button>
                <span class="w-10 text-center">{quantity}</span>
                <button
                  type="button"
                  class="px-3 py-2"
                  aria-label="Increase quantity"
                  onClick$={() => onQuantityChange(quantity + 1)}
                >
                  +
                </button>
              </div>
            ) : null}

            <button
              type="button"
              class="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAddingToCart || isAdmin || product.stock <= 0}
              onClick$={onAddToCart}
            >
              {isAdmin
                ? "Admins cannot purchase"
                : isAddingToCart
                  ? "Adding..."
                  : product.stock > 0
                    ? "Add to cart"
                    : "Out of stock"}
            </button>

            {!isAdmin ? (
              <button
                type="button"
                onClick$={onToggleWishlist}
                class={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition ${
                  isWishlisted
                    ? "border-rose-200 bg-rose-50 text-rose-600 dark:text-rose-400"
                    : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-rose-200 hover:text-rose-600 dark:text-rose-400"
                }`}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={isWishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06 1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            ) : null}

            {!isAdmin ? (
              <a href="/cart" class="btn-secondary">
                View cart
              </a>
            ) : null}
          </div>
        </div>
      </section>
    );
  },
);
