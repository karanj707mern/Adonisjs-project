import { useSignal, useVisibleTask$ } from '@builder.io/qwik'

export function usePreviewMode() {
  const isPreview = useSignal(false)

  useVisibleTask$(() => {
    const stored = localStorage.getItem('preview-mode')
    if (stored) {
      isPreview.value = stored === 'true'
    }
  })

  const toggle = () => {
    isPreview.value = !isPreview.value
    localStorage.setItem('preview-mode', String(isPreview.value))
  }

  return {
    isPreview,
    toggle,
  }
}
