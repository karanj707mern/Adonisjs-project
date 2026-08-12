import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useWishlist = routeLoader$(async () => {
  try {
    const response = await api.wishlist.getAll()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const wishlist = useWishlist()
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
            My Wishlist
          </h1>

          {loading.value ? (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} class="skeleton h-80 rounded-xl" />
              ))}
            </div>
          ) : wishlist.value.length === 0 ? (
            <div class="text-center py-16">
              <p class="text-xl text-stone-600 dark:text-stone-300 mb-8">
                Your wishlist is empty
              </p>
              <a href="/shop" class="btn btn-primary">
                Explore Products
              </a>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.value.map((item: any) => (
                <a key={item.id} href={`/product/${item.product?.id}`} class="card group cursor-pointer hover:shadow-xl transition-all duration-300">
                  <img
                    src={item.product?.image}
                    alt={item.product?.name}
                    class="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <h3 class="font-semibold text-stone-800 dark:text-stone-100">
                    {item.product?.name}
                  </h3>
                  <p class="text-primary-600 font-bold mt-2">
                    ₹{item.product?.price?.toLocaleString()}
                  </p>
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
  title: 'My Wishlist - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
