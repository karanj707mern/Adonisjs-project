import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useProfile = routeLoader$(async () => {
  try {
    const response = await api.auth.getProfile()
    return response.data
  } catch {
    return null
  }
})

export default component$(() => {
  const profile = useProfile()
  const name = useSignal('')
  const email = useSignal('')
  const phoneNumber = useSignal('')

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-2xl">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            My Profile
          </h1>

          <div class="card">
            <form class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  class="input-field"
                  value={name.value}
                  onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  class="input-field"
                  value={email.value}
                  onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  class="input-field"
                  value={phoneNumber.value}
                  onInput$={(e) => phoneNumber.value = (e.target as HTMLInputElement).value}
                />
              </div>

              <button type="button" class="btn btn-primary w-full">
                Update Profile
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'My Profile - Moringa Store',
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
}
