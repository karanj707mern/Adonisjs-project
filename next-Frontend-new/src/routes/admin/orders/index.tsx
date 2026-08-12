import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'

export const useOrders = routeLoader$(async () => {
  try {
    const response = await api.order.admin.getAll()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const orders = useOrders()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  return (
    <div>
      <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
        Order Management
      </h1>

      {loading.value ? (
        <div class="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} class="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div class="card overflow-hidden">
          <table class="w-full">
            <thead class="bg-stone-50 dark:bg-stone-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Order ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Customer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Total
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-stone-700">
              {orders.value.map((order: any) => (
                <tr key={order.id} class="hover:bg-stone-50 dark:hover:bg-stone-700">
                  <td class="px-6 py-4 text-sm font-medium text-stone-900 dark:text-stone-100">
                    #{order.id}
                  </td>
                  <td class="px-6 py-4 text-sm text-stone-600 dark:text-stone-300">
                    {order.user?.name || 'Guest'}
                  </td>
                  <td class="px-6 py-4 text-sm text-stone-600 dark:text-stone-300">
                    ₹{order.total?.toLocaleString()}
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {order.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-stone-600 dark:text-stone-300">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Order Management - Admin - Moringa Store',
}
