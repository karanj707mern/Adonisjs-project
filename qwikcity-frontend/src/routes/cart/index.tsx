import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import {
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  CART_CHANGED_EVENT,
} from "~/lib/storage";
import { createOrder } from "~/lib/api/order";
import { toast } from "~/lib/toast";

interface CartLine {
  id: string | number;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  [key: string]: unknown;
}

export default component$(() => {
  const cart = useStore<{ items: CartLine[]; address: string; pincode: string; name: string; placing: boolean }>({
    items: [],
    address: "",
    pincode: "",
    name: "",
    placing: false,
  });
  const nav = useNavigate();

  useVisibleTask$(() => {
    const refresh = () => {
      cart.items = getCartItems() as CartLine[];
    };
    refresh();
    const onCart = () => refresh();
    window.addEventListener(CART_CHANGED_EVENT, onCart);
    window.addEventListener("storage", onCart);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, onCart);
      window.removeEventListener("storage", onCart);
    };
  });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">Your Cart</h1>

      {cart.items.length === 0 ? (
        <div class="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
          <p>Your cart is empty.</p>
          <a href="/shop" class="btn-primary mt-4">Browse products</a>
        </div>
      ) : (
        <div class="mt-8 grid gap-8 lg:grid-cols-3">
          <div class="space-y-4 lg:col-span-2">
            {cart.items.map((item) => (
              <div key={item.id} class="card flex items-center gap-4 p-4">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name ?? "Product"}
                  class="h-20 w-20 rounded-lg object-cover"
                />
                <div class="flex-1">
                  <p class="font-medium">{item.name ?? "Product"}</p>
                  <p class="text-sm text-slate-500">{formatRupees(item.price)}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                      onClick$={() => {
                        updateCartItemQuantity(item.id, Number(item.quantity) - 1);
                        window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                      }}
                    >
                      −
                    </button>
                    <span class="w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700"
                      onClick$={() => {
                        updateCartItemQuantity(item.id, Number(item.quantity) + 1);
                        window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{formatRupees((Number(item.price) || 0) * (Number(item.quantity) || 0))}</p>
                  <button
                    type="button"
                    class="mt-2 text-sm text-rose-500 hover:underline"
                    onClick$={() => {
                      removeCartItem(item.id);
                      window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              class="text-sm text-slate-400 hover:text-rose-500"
              onClick$={() => {
                clearCart();
                window.dispatchEvent(new Event(CART_CHANGED_EVENT));
              }}
            >
              Clear cart
            </button>
          </div>

          <aside class="card h-fit p-6">
            <h2 class="text-lg font-semibold">Summary</h2>
            <div class="mt-3 flex justify-between text-sm">
              <span>Subtotal</span>
              <span class="font-semibold">{formatRupees(subtotal)}</span>
            </div>
            <div class="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <input class="input" placeholder="Full name" bind:value={cart.name} />
              <input class="input" placeholder="Shipping address" bind:value={cart.address} />
              <input class="input" placeholder="PIN code" bind:value={cart.pincode} />
            </div>
            <button
              type="button"
              class="btn-primary mt-4 w-full"
              disabled={cart.placing}
              onClick$={async () => {
                if (!cart.name || !cart.address || !cart.pincode) {
                  toast.error("Please fill in shipping details");
                  return;
                }
                cart.placing = true;
                try {
                  await createOrder({
                    items: cart.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
                    shippingAddress: { name: cart.name, address: cart.address, pincode: cart.pincode },
                  });
                  clearCart();
                  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                  toast.success("Order placed!");
                  nav("/orders");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not place order");
                } finally {
                  cart.placing = false;
                }
              }}
            >
              {cart.placing ? "Placing…" : `Place order · ${formatRupees(subtotal)}`}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
});
