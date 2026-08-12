import { useSignal, useVisibleTask$ } from '@builder.io/qwik'

export function useOrderSocket() {
  const socket = useSignal<any>(null)

  useVisibleTask$(() => {
    // Socket.io connection logic
  })

  return socket
}
