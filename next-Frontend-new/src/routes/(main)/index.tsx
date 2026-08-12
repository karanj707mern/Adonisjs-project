import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { ProductCard } from '~components/ProductCard'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useProducts = routeLoader$(async () => {
  try {
    const response = await api.products.getFeatured()
    return response.data
  } catch {
    return []
  }
})

export const useReviews = routeLoader$(async () => {
  try {
    const response = await api.review.getFeatured()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const products = useProducts()
  const reviews = useReviews()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    loading.value = false
  })

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        {/* Hero Section */}
        <section class="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
          <div class="container mx-auto px-4">
            <h1 class="text-4xl md:text-6xl font-bold mb-4">
              Welcome to Moringa Store
            </h1>
            <p class="text-xl mb-8 text-primary-100">
              Discover natural wellness products for a healthier you
            </p>
            <a href="/shop" class="btn bg-white text-primary-700 hover:bg-primary-50">
              Shop Now
            </a>
          </div>
        </section>

        {/* Featured Products */}
        <section class="py-16 container mx-auto px-4">
          <h2 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            Featured Products
          </h2>
          
          {loading.value ? (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} class="skeleton h-80 rounded-xl" />
              ))}
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.value.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Reviews */}
        <section class="py-16 bg-white dark:bg-stone-800">
          <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
              What Our Customers Say
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.value.map((review: any) => (
                <div key={review.id} class="card">
                  <div class="flex items-center mb-4">
                    <div class="flex text-yellow-400">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <h3 class="font-semibold text-stone-800 dark:text-stone-100 mb-2">
                    {review.title}
                  </h3>
                  <p class="text-stone-600 dark:text-stone-300 mb-4">
                    {review.content}
                  </p>
                  <p class="text-sm text-stone-500 dark:text-stone-400">
                    - {review.user?.name || 'Verified Customer'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Moringa Store - Natural Wellness Products',
  meta: [
    {
      name: 'description',
      content: 'Discover natural wellness products for a healthier you. Shop Moringa products online.',
    },
  ],
}
