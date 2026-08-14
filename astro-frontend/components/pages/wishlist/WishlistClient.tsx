'use client'
import { useState, useEffect } from 'react'

export default function WishlistClient() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/wishlist', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">My Wishlist</h1>
      {loading ? (
        <p className="text-stone-600 dark:text-stone-400">Loading wishlist...</p>
      ) : items.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-stone-800 rounded-lg shadow p-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">{item.product?.name || 'Product'}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
