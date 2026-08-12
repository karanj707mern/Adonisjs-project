import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'

export const useOverview = routeLoader$(async () => {
  try {
    const response = await api.admin.getOverview()
    return response.data
  } catch {
    return null
  }
})

export default component$(() => {
  const overview = useOverview()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  return (
    <div>
      <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
        Dashboard Overview
      </h1>

      {loading.value || !overview.value ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} class="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-stone-600 dark:text-stone-400">
              Total Orders
            </h3>
            <p class="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-2">
              {overview.value.totalOrders}
            </p>
          </div>

          <div class="card">
            <h3 class="text-sm font-medium text-stone-600 dark:text-stone-400">
              Total Revenue
            </h3>
            <p class="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-2">
              ₹{overview.value.totalRevenue?.toLocaleString()}
            </p>
          </div>

          <div class="card">
            <h3 class="text-sm font-medium text-stone-600 dark:text-stone-400">
              Total Products
            </h3>
            <p class="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-2">
              {overview.value.totalProducts}
            </p>
          </div>

          <div class="card">
            <h3 class="text-sm font-medium text-stone-600 dark:text-stone-400">
              Total Customers
            </h3>
            <p class="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-2">
              {overview.value.totalCustomers}
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Admin Dashboard - Moringa Store',
}
