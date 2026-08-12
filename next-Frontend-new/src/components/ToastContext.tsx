import { component$, useContext } from '@builder.io/qwik'
import { ToastContext } from './ToastProvider'

export const useToast = () => {
  const ctx = useContext(ToastContext)
  
  return {
    success: (message: string) => ctx.toast(message, 'success'),
    error: (message: string) => ctx.toast(message, 'error'),
    info: (message: string) => ctx.toast(message, 'info'),
    warning: (message: string) => ctx.toast(message, 'warning'),
  }
}
