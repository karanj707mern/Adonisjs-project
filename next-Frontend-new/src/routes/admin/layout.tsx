import { component$, useContextProvider, createContextId, useSignal } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'
import { AdminSidebar } from '~/components/admin/AdminSidebar'
import { AdminGuard } from '~/components/admin/AdminGuard'

export const AdminContext = createContextId<{ sidebarOpen: boolean }>('admin-context')

export const onGet: DocumentHead = ({ resolveValue }) => {
  return {
    title: 'Admin - Moringa Store',
    meta: [
      { name: 'robots', content: 'noindex' },
    ],
  }
}

export default component$(() => {
  const sidebarOpen = useSignal(true)
  useContextProvider(AdminContext, { sidebarOpen })

  return (
    <AdminGuard>
      <div class="min-h-screen bg-stone-100 dark:bg-stone-900">
        <AdminSidebar />
        
        <div class={`transition-all duration-300 ${sidebarOpen.value ? 'ml-64' : 'ml-0'}`}>
          <main class="p-8">
            <Slot />
          </main>
        </div>
      </div>
    </AdminGuard>
  )
})
