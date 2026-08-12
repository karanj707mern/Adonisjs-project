import { component$, Slot } from '@builder.io/qwik'
import { ErrorBoundary } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <ErrorBoundary
      fallback$={(error) => (
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              Something went wrong
            </h1>
            <p class="text-stone-600 dark:text-stone-300 mb-8">
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              class="btn btn-primary"
              onClick$={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      <Slot />
    </ErrorBoundary>
  )
})
