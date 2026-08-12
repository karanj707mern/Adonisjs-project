import { component$, useContextProvider, createContextId, useSignal } from '@builder.io/qwik'
import { Toaster } from 'sonner'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export const ToastContext = createContextId<{
  toast: (message: string, type?: ToastType) => void
}>('toast-context')

export const ToastProvider = component$(() => {
  const toastId = useSignal(0)

  const toast = (message: string, type: ToastType = 'info') => {
    toastId.value++
    ;(window as any).__toast?.(message, type)
  }

  useContextProvider(ToastContext, { toast })

  return (
    <>
      <Slot />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={4000}
      />
    </>
  )
})
