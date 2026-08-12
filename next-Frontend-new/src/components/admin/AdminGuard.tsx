import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { useSession } from '~/routes/layout'
import { useLocation } from '@builder.io/qwik-city'

export const AdminGuard = component$(() => {
  const session = useSession()
  const location = useLocation()
  const loading = useSignal(true)

  useVisibleTask$(() => {
    loading.value = false
  })

  if (loading.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-xl text-stone-600">Loading...</div>
      </div>
    )
  }

  if (!session.value?.user || session.value.user.role !== 'ADMIN') {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-stone-800 mb-4">Access Denied</h1>
          <p class="text-stone-600 mb-8">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <Slot />
})
