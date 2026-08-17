import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { Product, Review } from "~/lib/types";
import { getProduct } from "~/lib/api/product";
import { getProductReviews } from "~/lib/api/review";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees, renderStars } from "~/lib/formatters";
import { addCartItem, addWishlistItem, CART_CHANGED_EVENT, WISHLIST_CHANGED_EVENT } from "~/lib/storage";
import { toast } from "~/lib/toast";

export const useProduct = routeLoader$(async ({ params }) => {
  try {
    const data = await getProduct(params.id);
    const product: Product = Array.isArray(data)
      ? (data[0] as Product)
      : (data as Product);
    return { product, error: "" };
  } catch (err) {
    return { product: null, error: err instanceof Error ? err.message : "Product not found." };
  }
});

export default component$(() => {
  const data = useProduct();
  const ui = useStore({ quantity: 1, busy: false });
  const reviews = useStore<{ items: Review[]; loading: boolean }>({ items: [], loading: true });

  const productId = data.value.product?.id;

  const loadReviews = $(async () => {
    if (productId === undefined) return;
    reviews.loading = true;
    try {
      const result = await getProductReviews(productId);
      const list = Array.isArray(result)
        ? (result as Review[])
        : ((result as { reviews?: Review[] })?.reviews ?? []);
      reviews.items = list;
    } catch {
      reviews.items = [];
    } finally {
      reviews.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await loadReviews();
  });

  if (data.value.error || !data.value.product) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Product not found</h1>
        <p class="mt-2 text-slate-500">{data.value.error}</p>
        <a href="/shop" class="btn-primary mt-6">Back to shop</a>
      </div>
    );
  }

  const product = data.value.product;

  return (
    <div class="container-page py-10">
      <nav class="mb-6 text-sm text-slate-500">
        <a href="/" class="hover:text-neon">Home</a> / <a href="/shop" class="hover:text-neon">Shop</a> /{" "}
        <span class="text-slate-700 dark:text-slate-300">{product.name}</span>
      </nav>

      <div class="grid gap-8 lg:grid-cols-2">
        <div class="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <img src={resolveImageUrl(product.image)} alt={product.name} class="aspect-square w-full object-cover" />
        </div>

        <div>
          <h1 class="text-3xl font-bold">{product.name}</h1>
          <div class="mt-3 flex items-center gap-3">
            <span class="text-2xl font-bold">{formatRupees(product.price)}</span>
            {product.compareAtPrice ? (
              <span class="text-lg text-slate-400 line-through">{formatRupees(product.compareAtPrice)}</span>
            ) : null}
          </div>

          {product.description ? (
            <p class="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">{product.description}</p>
          ) : null}

          <div class="mt-6 flex items-center gap-3">
            <div class="flex items-center rounded-lg border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                class="px-3 py-2"
                aria-label="Decrease quantity"
                onClick$={() => (ui.quantity = Math.max(1, ui.quantity - 1))}
              >
                −
              </button>
              <span class="w-10 text-center">{ui.quantity}</span>
              <button
                type="button"
                class="px-3 py-2"
                aria-label="Increase quantity"
                onClick$={() => (ui.quantity = ui.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              class="btn-primary"
              disabled={ui.busy}
              onClick$={() => {
                addCartItem({ ...product, quantity: ui.quantity });
                if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                toast.success(`${product.name} added to cart`);
              }}
            >
              Add to cart
            </button>
            <button
              type="button"
              class="btn-ghost"
              onClick$={() => {
                addWishlistItem({ ...product });
                if (typeof window !== "undefined") window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
                toast.success("Added to wishlist");
              }}
            >
              Wishlist
            </button>
          </div>

          {product.stock !== undefined ? (
            <p class="mt-4 text-sm text-slate-500">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
          ) : null}
        </div>
      </div>

      <section class="mt-12">
        <h2 class="text-xl font-bold">Reviews</h2>
        {reviews.loading ? (
          <p class="mt-3 text-sm text-slate-500">Loading reviews…</p>
        ) : reviews.items.length === 0 ? (
          <p class="mt-3 text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div class="mt-4 space-y-4">
            {reviews.items.map((review) => (
              <div key={review.id} class="card p-4">
                <div class="flex items-center justify-between">
                  <span class="font-medium">{review.user?.name ?? "Anonymous"}</span>
                  <span class="text-neon" title={`${review.rating} / 5`}>{renderStars(review.rating)}</span>
                </div>
                {review.title ? <p class="mt-1 font-medium">{review.title}</p> : null}
                <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
