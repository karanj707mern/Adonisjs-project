import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import {
  getWishlistItems,
  removeWishlistItem,
  addCartItem,
  WISHLIST_CHANGED_EVENT,
  CART_CHANGED_EVENT,
} from "~/lib/storage";
import { toast } from "~/lib/toast";

interface WishItem {
  id: string | number;
  name?: string;
  price?: number;
  image?: string;
  [key: string]: unknown;
}

export default component$(() => {
  const state = useStore<{ items: WishItem[] }>({ items: [] });

  useVisibleTask$(() => {
    const refresh = () => {
      state.items = getWishlistItems() as WishItem[];
    };
    refresh();
    const onWish = () => refresh();
    window.addEventListener(WISHLIST_CHANGED_EVENT, onWish);
    window.addEventListener("storage", onWish);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, onWish);
      window.removeEventListener("storage", onWish);
    };
  });

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">Wishlist</h1>

      {state.items.length === 0 ? (
        <div class="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
          <p>Your wishlist is empty.</p>
          <a href="/shop" class="btn-primary mt-4">Browse products</a>
        </div>
      ) : (
        <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {state.items.map((item) => (
            <div key={item.id} class="card flex flex-col overflow-hidden">
              <img src={resolveImageUrl(item.image)} alt={item.name ?? "Product"} class="aspect-square w-full object-cover" />
              <div class="flex flex-1 flex-col p-4">
                <p class="font-medium">{item.name ?? "Product"}</p>
                <p class="mt-1 text-sm text-slate-500">{formatRupees(item.price)}</p>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="btn-primary flex-1"
                    onClick$={() => {
                      addCartItem({ ...item, quantity: 1 });
                      window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                      toast.success("Added to cart");
                    }}
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    class="btn-ghost"
                    onClick$={() => {
                      removeWishlistItem(item.id);
                      window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
