'use client'
import { useState, useEffect } from 'react'
import { apiRequest } from '../../../lib/api/http'

export default function CartPageInner() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/cart')
      .then((data: any) => {
        setItems(Array.isArray(data) ? data : data?.items ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center">Loading cart...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Shopping Cart</h1>
      {items.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-stone-800 rounded-lg shadow p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">{item.product?.name || 'Product'}</h3>
                <p className="text-stone-600 dark:text-stone-400">Qty: {item.quantity} x ₹{item.price}</p>
              </div>
              <p className="font-bold text-stone-900 dark:text-stone-100">₹{(item.quantity * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
