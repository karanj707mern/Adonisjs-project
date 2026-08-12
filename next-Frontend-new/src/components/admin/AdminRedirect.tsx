import { component$, useVisibleTask$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'

export const AdminRedirect = component$(() => {
  const location = useLocation()

  useVisibleTask$(() => {
    // Redirect logic would be handled here
  })

  return <Slot />
})
