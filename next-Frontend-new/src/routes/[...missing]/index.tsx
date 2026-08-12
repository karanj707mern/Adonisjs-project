import { component$ } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'

export const onGet = () => {
  throw new Error('Not found')
}

export default component$(() => {
  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
          404
        </h1>
        <p class="text-xl text-stone-600 dark:text-stone-300 mb-8">
          Oops! This page doesn't exist.
        </p>
        <a href="/" class="btn btn-primary">
          Go Home
        </a>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: '404 - Page Not Found - Moringa Store',
}
