import { component$ } from "@builder.io/qwik";
import { formatRupees } from "~/lib/formatters";
import { ShippingMethodSelector } from "./ShippingMethodSelector";
import type { StoreSettings, AddressForm } from "~/hooks/useCartLogic";

interface ShippingOption {
  key: string;
  label: string;
  amount: number;
  etaDays: number;
}

interface CheckoutSidebarProps {
  savedAddresses: Record<string, unknown>[];
  selectedAddressId: string;
  addressForm: AddressForm;
  storeSettings: StoreSettings;
  selectedShippingType: string;
  selectedPaymentMethod: string;
  startingCheckout: boolean;
  itemCount: number;
  canCheckout: boolean;
  pricingPreview: Record<string, unknown> | null;
  previewSubtotal: number;
  discount: number;
  previewShipping: number;
  previewHandling: number;
  previewCodCharge: number;
  previewTax: number;
  total: number;
  selectedShippingOption: ShippingOption;
  onSavedAddressChange$: (nextId: string) => void;
  onAddressChange$: (name: string, value: string) => void;
  onShippingTypeChange$: (key: string) => void;
  onPaymentMethodChange$: (method: string) => void;
  onCheckout$: () => void;
}

export const CheckoutSidebar = component$(
  ({
    savedAddresses,
    selectedAddressId,
    addressForm,
    storeSettings,
    selectedShippingType,
    selectedPaymentMethod,
    startingCheckout,
    itemCount,
    canCheckout,
    pricingPreview,
    previewSubtotal,
    discount,
    previewShipping,
    previewHandling,
    previewCodCharge,
    previewTax,
    total,
    selectedShippingOption,
    onSavedAddressChange$,
    onAddressChange$,
    onShippingTypeChange$,
    onPaymentMethodChange$,
    onCheckout$,
  }: CheckoutSidebarProps) => {
    const isDomestic =
      String(addressForm.country || "")
        .trim()
        .toLowerCase() === "india";

    return (
      <aside class="h-fit rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm card sm:p-7">
        <p class="text-sm uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300 text-center">
          Order Summary
        </p>
        <h2 class="mt-3 font-serif text-3xl text-[var(--text-primary)] text-center">
          Checkout preview
        </h2>

        {savedAddresses.length > 0 ? (
          <div class="mt-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label
                for="saved-address"
                class="text-sm font-medium text-[var(--text-secondary)]"
              >
                Saved address
              </label>
              <a
                href="/profile"
                class="text-sm text-emerald-700 dark:text-emerald-300 transition hover:text-emerald-900 dark:hover:text-emerald-200 text-center sm:text-right"
              >
                Manage addresses
              </a>
            </div>
            <select
              id="saved-address"
              value={selectedAddressId}
              onChange$={(_, el) =>
                onSavedAddressChange$((el as HTMLSelectElement).value)
              }
              class="mt-3 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
            >
              <option value="">Use the form below</option>
              {savedAddresses.map((address) => {
                const label = `${address.label} - ${address.city}${address.isDefault ? " (Default)" : ""}`;
                return (
                  <option
                    key={address.id as string | number}
                    value={address.id as string | number}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div class="mt-6 text-center">
            <a href="/profile" class="btn-secondary">
              Save addresses in profile
            </a>
          </div>
        )}

        <div class="mt-8 space-y-3 border-t border-[var(--border-color)] pt-6">
          <p class="text-sm uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300 text-center">
            Shipping address
          </p>
          <div class="grid gap-4">
            <div>
              <label
                for="recipientName"
                class="block text-center text-sm font-medium text-[var(--text-secondary)] sm:text-left"
              >
                Recipient name
              </label>
              <input
                id="recipientName"
                name="recipientName"
                value={addressForm.recipientName}
                onInput$={(_, el) =>
                  onAddressChange$(
                    "recipientName",
                    (el as HTMLInputElement).value,
                  )
                }
                class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label
                for="phoneNumber"
                class="block text-center text-sm font-medium text-[var(--text-secondary)] sm:text-left"
              >
                Phone number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={addressForm.phoneNumber}
                onInput$={(_, el) =>
                  onAddressChange$(
                    "phoneNumber",
                    (el as HTMLInputElement).value,
                  )
                }
                class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
                inputMode="tel"
              />
            </div>
            <input
              name="addressLine1"
              placeholder="Address line 1"
              value={addressForm.addressLine1}
              onInput$={(_, el) =>
                onAddressChange$("addressLine1", (el as HTMLInputElement).value)
              }
              class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
              required
              aria-label="Address line 1"
            />
            <input
              name="addressLine2"
              placeholder="Address line 2 (optional)"
              value={addressForm.addressLine2}
              onInput$={(_, el) =>
                onAddressChange$("addressLine2", (el as HTMLInputElement).value)
              }
              class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
              aria-label="Address line 2 (optional)"
            />
            <div class="grid gap-3 sm:grid-cols-2">
              <input
                name="city"
                placeholder="City"
                value={addressForm.city}
                onInput$={(_, el) =>
                  onAddressChange$("city", (el as HTMLInputElement).value)
                }
                class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
                aria-label="City"
              />
              <input
                name="state"
                placeholder="State"
                value={addressForm.state}
                onInput$={(_, el) =>
                  onAddressChange$("state", (el as HTMLInputElement).value)
                }
                class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
                aria-label="State"
              />
              <input
                name="postalCode"
                placeholder="Postal code"
                value={addressForm.postalCode}
                onInput$={(_, el) =>
                  onAddressChange$("postalCode", (el as HTMLInputElement).value)
                }
                class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
                aria-label="Postal code"
              />
              <input
                name="country"
                placeholder="Country"
                value={addressForm.country}
                onInput$={(_, el) =>
                  onAddressChange$("country", (el as HTMLInputElement).value)
                }
                class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                required
                aria-label="Country"
              />
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-4 border-t border-[var(--border-color)] pt-6">
          <ShippingMethodSelector
            options={storeSettings.shippingOptions}
            selected={selectedShippingType}
            onSelect$={onShippingTypeChange$}
            qualifiesForFreeShipping={false}
            cartCount={itemCount}
            isDomestic={isDomestic}
          />

          <div>
            <p class="text-sm uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300 text-center sm:text-left">
              Payment method
            </p>
            <div class="mt-4 grid gap-3">
              <button
                type="button"
                onClick$={() => onPaymentMethodChange$("online")}
                class={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
                  selectedPaymentMethod === "online"
                    ? "border-2 border-emerald-400 bg-emerald-400/10 dark:bg-emerald-900/30 dark:border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)] dark:shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                    : "border border-[var(--border-color)] bg-[var(--bg-primary)] hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300"
                }`}
              >
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p
                      class={`text-sm font-semibold text-center sm:text-left ${selectedPaymentMethod === "online" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"}`}
                    >
                      Pay online
                    </p>
                    <p
                      class={`mt-1 text-sm text-center sm:text-left ${selectedPaymentMethod === "online" ? "text-emerald-700/80 dark:text-emerald-300" : "text-[var(--text-muted)]"}`}
                    >
                      Secure checkout with Razorpay cards, UPI, wallets, and net
                      banking.
                    </p>
                  </div>
                  <span
                    class={`text-sm font-semibold whitespace-nowrap ${selectedPaymentMethod === "online" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"}`}
                  >
                    Recommended
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick$={() => onPaymentMethodChange$("cod")}
                class={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
                  selectedPaymentMethod === "cod"
                    ? "border-2 border-emerald-400 bg-emerald-400/10 dark:bg-emerald-900/30 dark:border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)] dark:shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                    : "border border-[var(--border-color)] bg-[var(--bg-primary)] hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300"
                }`}
              >
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p
                      class={`text-sm font-semibold text-center sm:text-left ${selectedPaymentMethod === "cod" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"}`}
                    >
                      Cash on delivery
                    </p>
                    <p
                      class={`mt-1 text-sm text-center sm:text-left ${selectedPaymentMethod === "cod" ? "text-emerald-700/80 dark:text-emerald-300" : "text-[var(--text-muted)]"}`}
                    >
                      Place the order now and pay when the shipment reaches you.
                    </p>
                  </div>
                  <span
                    class={`text-sm font-semibold whitespace-nowrap ${selectedPaymentMethod === "cod" ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"}`}
                  >
                    {formatRupees(storeSettings.codCharge || 0)}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-4 border-t border-[var(--border-color)] pt-6 text-sm text-[var(--text-secondary)]">
          <div class="flex items-center justify-between">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatRupees(previewSubtotal)}</span>
          </div>
          {discount > 0 ? (
            <div class="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <span>Promo discount</span>
              <span>-{formatRupees(discount)}</span>
            </div>
          ) : null}
          <div class="flex items-center justify-between">
            <span>{selectedShippingOption.label}</span>
            <span>{formatRupees(previewShipping)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Handling</span>
            <span>{formatRupees(previewHandling)}</span>
          </div>
          {selectedPaymentMethod === "cod" ? (
            <div class="flex items-center justify-between">
              <span>Cash on delivery fee</span>
              <span>{formatRupees(previewCodCharge)}</span>
            </div>
          ) : null}
          <div class="flex items-center justify-between">
            <span>Tax</span>
            <span>{formatRupees(previewTax)}</span>
          </div>
          {pricingPreview?.shippingZone ? (
            <div class="flex items-center justify-between">
              <span>Shipping zone</span>
              <span>
                {String(pricingPreview.shippingZone).replace(/_/g, " ")}
              </span>
            </div>
          ) : null}
          {pricingPreview?.fraudRiskLevel ? (
            <div class="flex items-center justify-between">
              <span>Risk review</span>
              <span>{pricingPreview.fraudRiskLevel as string}</span>
            </div>
          ) : null}
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-[var(--border-color)] pt-6">
          <span class="text-base font-medium text-[var(--text-primary)]">
            Total
          </span>
          <span class="text-2xl font-semibold text-[var(--text-primary)]">
            {formatRupees(total)}
          </span>
        </div>

        <button
          type="button"
          onClick$={onCheckout$}
          disabled={!canCheckout}
          class="btn-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {startingCheckout
            ? "Processing..."
            : selectedPaymentMethod === "cod"
              ? "Place cash on delivery order"
              : "Proceed to secure checkout"}
        </button>

        {!canCheckout ? (
          <p class="mt-3 text-center text-sm leading-5 text-[var(--text-muted)]">
            Complete the shipping address above to continue.
          </p>
        ) : null}
      </aside>
    );
  },
);
