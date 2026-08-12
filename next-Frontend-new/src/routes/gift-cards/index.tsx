import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useBalance = routeLoader$(async () => {
  try {
    const response = await api.giftCard.getBalance('')
    return response.data
  } catch {
    return null
  }
})

export default component$(() => {
  const balance = useBalance()
  const code = useSignal('')
  const message = useSignal('')

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-md">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8 text-center">
            Gift Card Balance
          </h1>

          <div class="card">
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Gift Card Code
                </label>
                <input
                  type="text"
                  placeholder="Enter your gift card code"
                  class="input-field"
                  value={code.value}
                  onInput$={(e) => code.value = (e.target as HTMLInputElement).value}
                />
              </div>

              <button
                class="btn btn-primary w-full"
                onClick$={async () => {
                  try {
                    await api.giftCard.redeem(code.value)
                    message.value = 'Gift card redeemed successfully!'
                  } catch {
                    message.value = 'Invalid or expired gift card code'
                  }
                }}
              >
                Check Balance
              </button>

              {message.value && (
                <p class="text-center text-sm text-stone-600 dark:text-stone-400">
                  {message.value}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Gift Card Balance - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
