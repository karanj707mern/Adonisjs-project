import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
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
  const isAdmin = useSignal(false)

  useVisibleTask$(() => {
    const user = session.value?.user
    if (user && user.role === 'ADMIN') {
      isAdmin.value = true
    }
  })

  return (
    <div>
      <MainNavbar />
      <main>
        <slot />
      </main>
      <Footer />
    </div>
  )
})
