import { component$, useSignal, useTask$ } from '@builder.io/qwik'
import { api } from '~lib/api-client'

interface AuthFormsProps {
  mode: 'login' | 'register' | 'forgot-password'
}

export const AuthForms = component$<AuthFormsProps>((props) => {
  const email = useSignal('')
  const password = useSignal('')
  const name = useSignal('')
  const loading = useSignal(false)
  const error = useSignal('')

  const handleSubmit = useTask$(async () => {
    // Form submission logic
  })

  return (
    <form onSubmit$={handleSubmit} class="space-y-6">
      {props.mode === 'register' && (
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            required
            class="input-field"
            value={name.value}
            onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
          />
        </div>
      )}

      <div>
        <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Email
        </label>
        <input
          type="email"
          required
          class="input-field"
          value={email.value}
          onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
        />
      </div>

      {props.mode !== 'forgot-password' && (
        <div>
          <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            class="input-field"
            value={password.value}
            onInput$={(e) => password.value = (e.target as HTMLInputElement).value}
          />
        </div>
      )}

      {error.value && (
        <p class="text-red-600 text-sm">{error.value}</p>
      )}

      <button
        type="submit"
        class="btn btn-primary w-full"
        disabled={loading.value}
      >
        {loading.value
          ? 'Please wait...'
          : props.mode === 'login'
          ? 'Sign In'
          : props.mode === 'register'
          ? 'Create Account'
          : 'Send Reset Link'}
      </button>
    </form>
  )
})
