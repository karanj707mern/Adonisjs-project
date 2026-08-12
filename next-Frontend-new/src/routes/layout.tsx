import { component$, Slot } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { ThemeProvider } from '~/components/ThemeProvider'
import { ToastProvider } from '~/components/ToastProvider'
import { SessionHydrator } from '~/components/SessionHydrator'

export default component$(() => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionHydrator />
        <main class="min-h-screen bg-stone-50 dark:bg-stone-900">
          <Slot />
        </main>
      </ToastProvider>
    </ThemeProvider>
  )
})

export const head: DocumentHead = {
  title: 'Moringa Store',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { charset: 'utf-8' },
  ],
  links: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
}
