import { component$ } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
          Order Not Found
        </h1>
        <p class="text-stone-600 dark:text-stone-300 mb-8">
          The order you're looking for doesn't exist or has been removed.
        </p>
        <a href="/orders" class="btn btn-primary">
          Back to Orders
        </a>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Order Not Found - Moringa Store',
}
