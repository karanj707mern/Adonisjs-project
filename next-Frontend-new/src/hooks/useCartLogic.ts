import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { api } from '~lib/api-client'

export function useCartLogic() {
  const cartItems = useSignal<any[]>([])
  const loading = useSignal(false)
  const error = useSignal('')

  const loadCart = async () => {
    loading.value = true
    try {
      const response = await api.cart.get()
      cartItems.value = response.data
    } catch (e) {
      error.value = 'Failed to load cart'
    } finally {
      loading.value = false
    }
  }

  const addToCart = async (productId: number, quantity: number = 1) => {
    loading.value = true
    try {
      await api.cart.add({ productId, quantity })
      await loadCart()
    } catch (e) {
      error.value = 'Failed to add to cart'
    } finally {
      loading.value = false
    }
  }

  return {
    cartItems,
    loading,
    error,
    loadCart,
    addToCart,
  }
}
