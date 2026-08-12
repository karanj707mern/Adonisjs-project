import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'
import { useCartLogic } from '~/hooks/useCartLogic'

export const useProduct = routeLoader$(async ({ params, status }) => {
  try {
    const response = await api.products.getById(params.id)
    return response.data
  } catch {
    status(404)
    return null
  }
})

export default component$(() => {
  const product = useProduct()
  const { addToCart } = useCartLogic()
  const loading = useSignal(true)

  useVisibleTask$(() => {
    loading.value = false
  })

  if (!product) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
            Product Not Found
          </h1>
          <a href="/shop" class="btn btn-primary">
            Back to Shop
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <img
              src={product.image}
              alt={product.name}
              class="w-full h-96 object-cover rounded-xl"
            />

            <div>
              <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
                {product.name}
              </h1>
              
              <p class="text-2xl font-bold text-primary-600 mb-4">
                ₹{product.price?.toLocaleString()}
              </p>

              <p class="text-stone-600 dark:text-stone-300 mb-6">
                {product.description}
              </p>

              <button
                class="btn btn-primary w-full md:w-auto"
                onClick$={() => addToCart(product.id)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue }) => {
  const product = resolveValue(useProduct)
  
  if (!product) {
    return {
      title: 'Product Not Found - Moringa Store',
    }
  }

  return {
    title: `${product.name} - Moringa Store`,
    meta: [
      {
        name: 'description',
        content: product.description,
      },
    ],
  }
}
