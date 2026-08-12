import { useSignal } from '@builder.io/qwik'
import { useToast } from '~/components/ToastProvider'

export function useToast() {
  const toast = useToast()
  
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
  }
}
