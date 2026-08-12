import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useSession = routeLoader$(async () => {
  try {
    const response = await api.auth.getSession()
    return response.data
  } catch {
    return { user: null }
  }
})

export default component$(() => {
  const session = useSession()
  const mode = useSignal<'login' | 'register' | 'forgot-password'>('login')

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="card">
            <h1 class="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-6 text-center">
              {mode.value === 'login' ? 'Sign In' : mode.value === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>

            {session.value?.user ? (
              <div class="text-center">
                <p class="text-stone-600 dark:text-stone-300 mb-4">
                  You are already logged in as {session.value.user.name}
                </p>
                <a href="/" class="btn btn-primary">
                  Go to Home
                </a>
              </div>
            ) : (
              <>
                <div class="space-y-6">
                  {mode.value === 'register' && (
                    <div>
                      <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        class="input-field"
                        placeholder="John Doe"
                      />
                    </div>
                  )}

                  <div>
                    <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      class="input-field"
                      placeholder="you@example.com"
                    />
                  </div>

                  {mode.value !== 'forgot-password' && (
                    <div>
                      <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        class="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  <button class="btn btn-primary w-full">
                    {mode.value === 'login' ? 'Sign In' : mode.value === 'register' ? 'Create Account' : 'Send Reset Link'}
                  </button>
                </div>

                <div class="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
                  {mode.value === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        class="text-primary-600 hover:text-primary-700"
                        onClick$={() => mode.value = 'register'}
                      >
                        Sign up
                      </button>
                      <br />
                      <button
                        class="text-primary-600 hover:text-primary-700 mt-2"
                        onClick$={() => mode.value = 'forgot-password'}
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        class="text-primary-600 hover:text-primary-700"
                        onClick$={() => mode.value = 'login'}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Sign In - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
