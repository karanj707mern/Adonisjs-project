import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { useOrderSocket } from './useOrderSocket'

export function useOrdersLogic() {
  const orders = useSignal<any[]>([])
  const loading = useSignal(false)
  const activeTab = useSignal<'active' | 'delivered' | 'cancelled' | 'support'>('active')
  const socket = useOrderSocket()

  const loadOrders = async () => {
    loading.value = true
    try {
      const response = await fetch('/api/v1/orders')
      const data = await response.json()
      orders.value = data.data
    } catch (e) {
      console.error('Failed to load orders', e)
    } finally {
      loading.value = false
    }
  }

  useVisibleTask$(() => {
    loadOrders()
  })

  return {
    orders,
    loading,
    activeTab,
    loadOrders,
  }
}
