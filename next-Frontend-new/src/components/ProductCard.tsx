import { component$, useSignal } from '@builder.io/qwik'
import type { Product } from '~/lib/types'

interface ProductCardProps {
  product: Product
  onAddToCart$?: () => void
}

export const ProductCard = component$<ProductCardProps>((props) => {
  return (
    <div class="card group cursor-pointer hover:shadow-xl transition-all duration-300">
      <div class="relative overflow-hidden rounded-lg mb-4">
        <img
          src={props.product.image}
          alt={props.product.name}
          class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {props.product.compareAtPrice && (
          <span class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
            Sale
          </span>
        )}
      </div>

      <div class="space-y-2">
        <h3 class="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2">
          {props.product.name}
        </h3>

        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-primary-600">
            ₹{props.product.price?.toLocaleString()}
          </span>
          {props.product.compareAtPrice && (
            <span class="text-sm text-stone-500 line-through">
              ₹{props.product.compareAtPrice?.toLocaleString()}
            </span>
          )}
        </div>

        {props.product.stock > 0 ? (
          <button
            class="btn btn-primary w-full"
            onClick$={props.onAddToCart$}
          >
            Add to Cart
          </button>
        ) : (
          <button class="btn btn-secondary w-full" disabled>
            Out of Stock
          </button>
        )}
      </div>
    </div>
  )
})
