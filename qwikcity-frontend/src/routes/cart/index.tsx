import { component$ } from "@builder.io/qwik";
import { useCartLogic } from "~/hooks/useCartLogic";
import { CartItemCard } from "~/components/cart/CartItemCard";
import { GuestPrompt } from "~/components/cart/GuestPrompt";
import { CartWishlistPreview } from "~/components/cart/CartWishlistPreview";
import { CheckoutSidebar } from "~/components/cart/CheckoutSidebar";
import { CartPageShell } from "~/components/cart/CartPageShell";

export default component$(() => {
  const logic = useCartLogic();

  return (
    <CartPageShell>
      <div class="theme-transition">
        <main>
          <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="pill-dark min-h-10 px-4 text-sm font-semibold">
                  Items {logic.itemCount}
                </span>
                <a href="/orders" class="btn-nav">
                  Orders
                </a>
              </div>
              <a href="/shop" class="btn-secondary">
                Continue shopping
              </a>
            </div>
          </div>

          <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
            {logic.error ? (
              <div class="mb-8 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
                {logic.error}
              </div>
            ) : null}

            <div class="grid gap-8 lg:grid-cols-5">
              <div class="lg:col-span-3 space-y-5">
                <div class="flex flex-col gap-2">
                  <p class="text-sm uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
                    Cart Summary
                  </p>
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <h2 class="font-serif text-3xl text-[var(--text-primary)] sm:text-4xl">
                      {logic.itemCount > 0
                        ? `${logic.itemCount} item${logic.itemCount > 1 ? "s" : ""} ready for checkout`
                        : "Your cart is empty"}
                    </h2>
                    {logic.items.length > 0 ? (
                      <button
                        type="button"
                        onClick$={logic.handleClearCart$}
                        class="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                      >
                        Clear cart
                      </button>
                    ) : null}
                  </div>
                </div>

                <section>
                  {!logic.isLoggedIn && logic.items.length > 0 ? (
                    <GuestPrompt
                      onSignIn$={() => {
                        location.href =
                          "/auth?from=" +
                          encodeURIComponent("/cart") +
                          "&authMessage=" +
                          encodeURIComponent(
                            "Sign in to preserve your cart and checkout faster.",
                          );
                      }}
                    />
                  ) : null}

                  {logic.items.length === 0 ? (
                    <div class="rounded-[2rem] border border-dashed border-[var(--border-strong)] bg-[var(--bg-secondary)] p-8 text-center shadow-sm sm:p-10 card">
                      <h3 class="font-serif text-3xl text-[var(--text-primary)]">
                        Nothing here yet
                      </h3>
                      <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                        Explore moringa products and add a few favorites to
                        start your cart.
                      </p>
                      <a href="/" class="btn-primary mt-6">
                        Go to store
                      </a>
                    </div>
                  ) : (
                    <div class="space-y-5">
                      {logic.items.map((item) => (
                        <CartItemCard
                          key={item.id as string | number}
                          item={item}
                          onRemove$={logic.handleRemoveItem$}
                          onQuantityChange$={logic.handleQuantityChange$}
                          addingToCartId={logic.addingToCartId}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <CartWishlistPreview
                  items={logic.filteredWishlistItems}
                  onAddToCart$={logic.handleAddToCart$}
                  onRemoveFromWishlist$={logic.handleRemoveWishlistItem$}
                />
              </div>

              {logic.items.length > 0 ? (
                <div class="lg:col-span-2">
                  <CheckoutSidebar
                    savedAddresses={logic.savedAddresses}
                    selectedAddressId={logic.selectedAddressId}
                    addressForm={logic.addressForm}
                    storeSettings={logic.storeSettings}
                    selectedShippingType={logic.selectedShippingType}
                    selectedPaymentMethod={logic.selectedPaymentMethod}
                    startingCheckout={logic.placing}
                    itemCount={logic.itemCount}
                    canCheckout={logic.canCheckout}
                    pricingPreview={logic.pricingPreview}
                    previewSubtotal={logic.previewSubtotal}
                    discount={logic.discount}
                    previewShipping={logic.previewShipping}
                    previewHandling={logic.previewHandling}
                    previewCodCharge={logic.previewCodCharge}
                    previewTax={logic.previewTax}
                    total={logic.total}
                    selectedShippingOption={
                      logic.selectedShippingOption as Record<
                        string,
                        unknown
                      > & {
                        key: string;
                        label: string;
                        amount: number;
                        etaDays: number;
                      }
                    }
                    onSavedAddressChange$={logic.handleSavedAddressSelect$}
                    onAddressChange$={logic.handleAddressChange$}
                    onShippingTypeChange$={logic.setSelectedShippingType}
                    onPaymentMethodChange$={logic.setSelectedPaymentMethod}
                    onCheckout$={logic.handleCheckout$}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </CartPageShell>
  );
});
