import { component$ } from '@builder.io/qwik'
import { Toaster } from 'sonner'

export const ToasterComponent = component$(() => {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
    />
  )
})
