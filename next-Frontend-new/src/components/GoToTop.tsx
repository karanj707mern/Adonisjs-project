import { component$ } from '@builder.io/qwik'

export const GoToTop = component$(() => {
  return (
    <button
      class="fixed bottom-8 right-8 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      onClick$={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
})
