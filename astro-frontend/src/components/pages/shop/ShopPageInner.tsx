'use client'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useCurrentUser } from '../../../lib/storage'
import type { Product, User } from '../../../lib/types'
import { addCartItem } from '../../../lib/api/cart'
import ProductCard from '../../Home/ProductCard'

type BrokenImageId = string | number

export default function ShopPageInner({
  initialProducts,
  initialError,
}: {
  initialProducts: Product[]
  initialError: string
}) {
  const currentUser = useCurrentUser() as User | null
  const isAdmin = currentUser?.role === 'ADMIN'

  const [brokenImages, setBrokenImages] = useState<Set<BrokenImageId>>(new Set())
  const [wishlisted, setWishlisted] = useState<Set<BrokenImageId>>(new Set())

  const handleImageError = useCallback((id: BrokenImageId) => {
    setBrokenImages((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlisted((prev) => {
      const next = new Set(prev)
      if (next.has(product.id)) {
        next.delete(product.id)
      } else {
        next.add(product.id)
      }
      return next
    })
  }, [])

  const handleAddToCart = useCallback(
    async (product: Product) => {
      if (isAdmin) {
        toast.error('Admins cannot purchase products')
        return
      }
      if (product.stock <= 0) {
        toast.error('This product is out of stock')
        return
      }
      try {
        await addCartItem(product.id, 1)
        toast.success(`Added "${product.name}" to your cart`)
      } catch {
        toast.error('Could not add item to cart. Please try again.')
      }
    },
    [isAdmin],
  )

  if (initialError) {
    return <div className="p-8 text-center text-red-600">{initialError}</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-8">
        Shop All Products
      </h1>
      {initialProducts.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">
          No products available.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlisted.has(product.id)}
              isAdmin={isAdmin}
              brokenImages={brokenImages}
              onImageError={handleImageError}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
