import { component$, useSignal } from "@builder.io/qwik";
import type { Product } from "~/lib/types";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import { addCartItem, addWishlistItem } from "~/lib/storage";
import { CART_CHANGED_EVENT, WISHLIST_CHANGED_EVENT } from "~/lib/storage";
import { toast } from "~/lib/toast";

export const ProductCard = component$<{ product: Product }>(({ product }) => {
  const adding = useSignal(false);

  return (
    <div class="card group flex flex-col overflow-hidden">
      <a href={`/product/${product.id}`} class="block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={resolveImageUrl(product.image)}
          alt={product.name}
          loading="lazy"
          class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </a>
      <div class="flex flex-1 flex-col p-4">
        <a href={`/product/${product.id}`} class="font-medium leading-tight hover:text-neon">
          {product.name}
        </a>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-lg font-bold">{formatRupees(product.price)}</span>
          {product.compareAtPrice ? (
            <span class="text-sm text-slate-400 line-through">
              {formatRupees(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button
            type="button"
            class="btn-primary flex-1"
            disabled={adding.value}
            onClick$={async () => {
              adding.value = true;
              addCartItem({ ...product, quantity: 1 });
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event(CART_CHANGED_EVENT));
              }
              toast.success(`${product.name} added to cart`);
              adding.value = false;
            }}
          >
            Add to cart
          </button>
          <button
            type="button"
            class="btn-ghost px-3"
            aria-label="Add to wishlist"
            onClick$={() => {
              addWishlistItem({ ...product });
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
              }
              toast.success("Added to wishlist");
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
