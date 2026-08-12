import { useSignal } from '@builder.io/qwik'
import { useToast } from '~/components/ToastProvider'

export function useCart() {
  const items = useSignal<any[]>([])
  const loading = useSignal(false)

  const addItem = (product: any) => {
    const existing = items.value.find((i) => i.productId === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value = [...items.value, { ...product, quantity: 1 }]
    }
  }

  const removeItem = (productId: number) => {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  const clearCart = () => {
    items.value = []
  }

  return {
    items,
    loading,
    addItem,
    removeItem,
    clearCart,
  }
}
