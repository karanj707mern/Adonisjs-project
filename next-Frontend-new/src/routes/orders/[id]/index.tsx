import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useOrder = routeLoader$(async ({ params, status }) => {
  try {
    const response = await api.order.getById(params.id)
    return response.data
  } catch {
    status(404)
    return null
  }
})

export default component$(() => {
  const order = useOrder()
  const loading = useSignal(true)

  useVisibleTask$(() => {
    loading.value = false
  })

  if (!order.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
            Order Not Found
          </h1>
          <a href="/orders" class="btn btn-primary">
            Back to Orders
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            Order #{order.value.id}
          </h1>
          <p class="text-stone-600 dark:text-stone-400 mb-8">
            Placed on {new Date(order.value.createdAt).toLocaleDateString()}
          </p>

          <div class="card mb-8">
            <h2 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              Order Status
            </h2>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              order.value.status === 'DELIVERED'
                ? 'bg-green-100 text-green-800'
                : order.value.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.value.status}
            </span>
          </div>

          <div class="card mb-8">
            <h2 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              Items
            </h2>
            <div class="space-y-4">
              {order.value.items?.map((item: any) => (
                <div key={item.id} class="flex justify-between items-center">
                  <div>
                    <p class="font-medium text-stone-800 dark:text-stone-100">
                      {item.product?.name}
                    </p>
                    <p class="text-sm text-stone-600 dark:text-stone-400">
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                    </p>
                  </div>
                  <p class="font-medium text-stone-800 dark:text-stone-100">
                    ₹{(item.quantity * item.price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div class="card">
            <h2 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              Shipping Address
            </h2>
            <p class="text-stone-600 dark:text-stone-300">
              {order.value.recipientName}<br />
              {order.value.addressLine1}<br />
              {order.value.addressLine2 && <>{order.value.addressLine2}<br /></>}
              {order.value.city}, {order.value.state} {order.value.postalCode}<br />
              {order.value.country}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: ({ resolveValue }) => {
    const order = resolveValue(useOrder)
    return order ? `Order #${order.id} - Moringa Store` : 'Order - Moringa Store'
  },
}
