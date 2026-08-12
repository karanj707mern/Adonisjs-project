import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useOrders = routeLoader$(async ({ url }) => {
  const status = url.searchParams.get('status') || 'active'
  try {
    const response = await api.order.getAll({ status })
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
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            My Orders
          </h1>

          {loading.value ? (
            <div class="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} class="skeleton h-32 rounded-xl" />
              ))}
            </div>
          ) : orders.value.length === 0 ? (
            <div class="text-center py-16">
              <p class="text-xl text-stone-600 dark:text-stone-300 mb-8">
                No orders found
              </p>
            </div>
          ) : (
            <div class="space-y-4">
              {orders.value.map((order: any) => (
                <a key={order.id} href={`/orders/${order.id}`} class="card block hover:shadow-xl transition-shadow cursor-pointer">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-sm text-stone-600 dark:text-stone-400">
                        Order #{order.id}
                      </p>
                      <p class="text-sm text-stone-600 dark:text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span class={`px-3 py-1 text-sm font-medium rounded-full ${
                      order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div class="space-y-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} class="flex justify-between text-sm">
                        <span class="text-stone-700 dark:text-stone-300">
                          {item.product?.name} × {item.quantity}
                        </span>
                        <span class="text-stone-600 dark:text-stone-400">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div class="border-t border-stone-200 dark:border-stone-700 mt-4 pt-4 flex justify-between items-center">
                    <span class="font-bold text-stone-900 dark:text-stone-100">
                      Total: ₹{order.total?.toLocaleString()}
                    </span>
                    <div class="flex gap-2">
                      <button class="btn btn-nav text-sm">
                        View Details
                      </button>
                      {order.status === 'DELIVERED' && (
                        <button class="btn btn-primary text-sm">
                          Return/Exchange
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'My Orders - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
