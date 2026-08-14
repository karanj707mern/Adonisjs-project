'use client'
import { useState, useEffect } from 'react'

export default function OrdersPageInner() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/order', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">My Orders</h1>
      {loading ? (
        <p className="text-stone-600 dark:text-stone-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white dark:bg-stone-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">Order #{order.id}</h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-sm">
                  {order.status}
                </span>
              </div>
              <p className="mt-2 font-bold text-stone-900 dark:text-stone-100">₹{order.total}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
