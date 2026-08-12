import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'

export const onGet = routeLoader$(({ url }) => {
  const token = url.searchParams.get('token')
  return { token }
})

export default component$(() => {
  const token = useSignal('')
  const password = useSignal('')
  const confirmPassword = useSignal('')
  const message = useSignal('')
  const error = useSignal('')

  return (
    <div class="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-stone-900 dark:text-stone-100">
            Reset Password
          </h1>
          <p class="mt-2 text-stone-600 dark:text-stone-400">
            Enter your new password below
          </p>
        </div>

        <div class="card">
          <form
            onSubmit$={async (e) => {
              e.preventDefault()
              if (password.value !== confirmPassword.value) {
                error.value = 'Passwords do not match'
                return
              }

              try {
                const response = await fetch('/api/v1/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: token.value,
                    password: password.value,
                  }),
                })

                const data = await response.json()

                if (response.ok) {
                  message.value = 'Password reset successful! Redirecting to login...'
                  setTimeout(() => {
                    window.location.href = '/auth'
                  }, 2000)
                } else {
                  error.value = data.message || 'Failed to reset password'
                }
              } catch {
                error.value = 'An error occurred'
              }
            }}
            class="space-y-6"
          >
            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                class="input-field"
                placeholder="••••••••"
                value={password.value}
                onInput$={(e) => password.value = (e.target as HTMLInputElement).value}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                class="input-field"
                placeholder="••••••••"
                value={confirmPassword.value}
                onInput$={(e) => confirmPassword.value = (e.target as HTMLInputElement).value}
              />
            </div>

            {error.value && (
              <p class="text-red-600 text-sm">{error.value}</p>
            )}

            {message.value && (
              <p class="text-green-600 text-sm">{message.value}</p>
            )}

            <button type="submit" class="btn btn-primary w-full">
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Reset Password - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
