'use client'
import { useState } from 'react'

export default function ProductDetailsClient({ product, initialReviews }: { product: any, initialReviews: any }) {
  const [qty, setQty] = useState(1)

  if (!product) {
    return <div className="p-8 text-center text-stone-600 dark:text-stone-400">Product not found.</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.image || '/placeholder.png'}
            alt={product.name}
            className="w-full rounded-lg shadow"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{product.name}</h1>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">₹{product.price}</p>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{product.description}</p>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Qty:</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
            />
            <button className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
