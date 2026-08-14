'use client'
import { ProductCard } from '~/components/ProductCard'

export default function ShopPageInner({ initialProducts, initialError }: { initialProducts: any[], initialError: string }) {
  if (initialError) {
    return <div className="p-8 text-center text-red-600">{initialError}</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-8">Shop All Products</h1>
      {initialProducts.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
