import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'

export const useProducts = routeLoader$(async () => {
  try {
    const response = await api.products.admin.getAll()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const products = useProducts()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  return (
    <div>
      <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
        Product Management
      </h1>

      {loading.value ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} class="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div class="card overflow-hidden">
          <table class="w-full">
            <thead class="bg-stone-50 dark:bg-stone-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Product
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Price
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Stock
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-stone-700">
              {products.value.map((product: any) => (
                <tr key={product.id} class="hover:bg-stone-50 dark:hover:bg-stone-700">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        class="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p class="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {product.name}
                        </p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-stone-600 dark:text-stone-300">
                    ₹{product.price?.toLocaleString()}
                  </td>
                  <td class="px-6 py-4 text-sm text-stone-600 dark:text-stone-300">
                    {product.stock}
                  </td>
                  <td class="px-6 py-4">
                    <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
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
  title: 'Product Management - Admin - Moringa Store',
}
