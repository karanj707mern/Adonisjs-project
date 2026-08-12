import { component$, Slot } from '@builder.io/qwik'

export default component$(() => {
  return (
    <div class="flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-4">
          Coming Soon
        </h1>
        <p class="text-stone-600 dark:text-stone-300 mb-8">
          This page is under construction.
        </p>
        <Slot />
      </div>
    </div>
  )
})
