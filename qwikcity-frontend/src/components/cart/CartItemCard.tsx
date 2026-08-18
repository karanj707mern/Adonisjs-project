import { component$ } from "@builder.io/qwik";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import type { CartItem } from "~/hooks/useCartLogic";

interface CartItemCardProps {
  item: CartItem;
  onRemove$: (id: string | number, name: string) => void;
  onQuantityChange$: (id: string | number, quantity: number) => void;
  addingToCartId: string | number | null;
}

export const CartItemCard = component$(
  ({ item, onRemove$, onQuantityChange$, addingToCartId }: CartItemCardProps) => {
    const product = item.product as Record<string, unknown>;
    const imageUrl = resolveImageUrl(product?.image as string | undefined);
    const quantity = item.quantity as number;

    return (
      <article class="grid gap-6 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm md:grid-cols-[200px_1fr] card">
        <div class="flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product?.name as string}
            width={400}
            height={400}
            loading="lazy"
            class="h-40 w-full max-w-[200px] rounded-[1.5rem] object-cover"
          />
        </div>

        <div class="flex flex-col justify-between gap-4">
          <div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                  {formatRupees(product?.price as number)}
                </p>
                <h3 class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {product?.name as string}
                </h3>
              </div>

              <button
                type="button"
                onClick$={() =>
                  onRemove$(item.id as string | number, product?.name as string)
                }
                class="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              >
                Remove
              </button>
            </div>

            <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              {product?.description as string}
            </p>
          </div>

          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              class="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2"
              role="group"
            >
              <button
                type="button"
                onClick$={() =>
                  onQuantityChange$(
                    item.id as string | number,
                    Math.max(1, quantity - 1),
                  )
                }
                disabled={quantity <= 1 || addingToCartId === item.id}
                class="h-10 w-10 rounded-full bg-[var(--bg-secondary)] text-lg text-[var(--text-secondary)] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span class="min-w-8 text-center text-sm font-medium text-[var(--text-primary)]">
                {quantity}
              </span>
              <button
                type="button"
                onClick$={() =>
                  onQuantityChange$(item.id as string | number, quantity + 1)
                }
                disabled={addingToCartId === item.id}
                class="h-10 w-10 rounded-full bg-[var(--bg-secondary)] text-lg text-[var(--text-secondary)] shadow-sm"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <p class="text-center text-lg font-semibold text-[var(--text-primary)] sm:text-right">
              {formatRupees(Number(product?.price) * quantity)}
            </p>
          </div>
        </div>
      </article>
    );
  },
);
