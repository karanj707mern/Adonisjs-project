import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useProducts = routeLoader$(async () => {
  try {
    const response = await api.products.getAll()
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
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            Shop All Products
          </h1>

          {loading.value ? (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} class="skeleton h-80 rounded-xl" />
              ))}
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.value.map((product: any) => (
                <a key={product.id} href={`/product/${product.id}`} class="card group cursor-pointer hover:shadow-xl transition-all duration-300">
                  <img
                    src={product.image}
                    alt={product.name}
                    class="w-full h-64 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  <h3 class="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2">
                    {product.name}
                  </h3>
                  <p class="text-primary-600 font-bold mt-2">
                    ₹{product.price?.toLocaleString()}
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
  title: 'Shop - Moringa Store',
  meta: [
    {
      name: 'description',
      content: 'Browse our collection of natural wellness products.',
    },
  ],
}
