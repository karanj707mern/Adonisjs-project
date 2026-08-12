import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useCart = routeLoader$(async () => {
  try {
    const response = await api.cart.get()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const cart = useCart()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  const total = cart.value.reduce((sum: number, item: any) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            Shopping Cart
          </h1>

          {loading.value ? (
            <div class="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} class="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : cart.value.length === 0 ? (
            <div class="text-center py-16">
              <p class="text-xl text-stone-600 dark:text-stone-300 mb-8">
                Your cart is empty
              </p>
              <a href="/shop" class="btn btn-primary">
                Continue Shopping
              </a>
            </div>
          ) : (
            <div class="space-y-4">
              {cart.value.map((item: any) => (
                <div key={item.id} class="card flex justify-between items-center">
                  <div class="flex items-center gap-4">
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      class="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 class="font-semibold text-stone-800 dark:text-stone-100">
                        {item.product?.name}
                      </h3>
                      <p class="text-stone-600 dark:text-stone-400">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p class="font-bold text-stone-800 dark:text-stone-100">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              <div class="card mt-8">
                <div class="flex justify-between items-center">
                  <span class="text-xl font-bold text-stone-800 dark:text-stone-100">
                    Total
                  </span>
                  <span class="text-2xl font-bold text-primary-600">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                <button class="btn btn-primary w-full mt-4">
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Shopping Cart - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
