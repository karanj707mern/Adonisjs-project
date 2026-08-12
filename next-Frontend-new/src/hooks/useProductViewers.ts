import { useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { io, Socket } from 'socket.io-client'

export function useProductViewers(productId: string | number) {
  const viewerCount = useSignal(0)
  const socket = useSignal<Socket | null>(null)

  useVisibleTask$(({ cleanup }) => {
    const s = io('http://localhost:5000', {
      transports: ['websocket'],
    })

    s.on('connect', () => {
      s.emit('product:view', { productId })
    })

    s.on('product:viewers', (count: number) => {
      viewerCount.value = count
    })

    socket.value = s

    cleanup(() => {
      s.disconnect()
    })
  })

  return viewerCount
}
