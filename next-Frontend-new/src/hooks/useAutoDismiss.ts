import { useSignal } from '@builder.io/qwik'
import { useToast } from '~/components/ToastProvider'

export function useAutoDismiss(
  value: any,
  onDismiss: () => void,
  delay: number = 5000
) {
  const toast = useToast()
  const timer = useSignal<any>(null)

  if (value) {
    timer.value = setTimeout(() => {
      onDismiss()
    }, delay)
  }

  return timer
}
