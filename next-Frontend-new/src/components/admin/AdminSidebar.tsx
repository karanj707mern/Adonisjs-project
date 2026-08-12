import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { useSession } from '~/routes/layout'
import { ThemeToggle } from '~/components/ThemeToggle'

export const AdminSidebar = component$(() => {
  const session = useSession()
  const isPreview = useSignal(false)
  const sidebarOpen = useSignal(true)

  useVisibleTask$(() => {
    const stored = localStorage.getItem('preview-mode')
    if (stored) {
      isPreview.value = stored === 'true'
    }
  })

  return (
    <div class={`fixed left-0 top-0 h-screen bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 transition-all duration-300 ${
      sidebarOpen.value ? 'w-64' : 'w-0'
    }`}>
      <div class="p-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold text-primary-600">Admin</h2>
          <ThemeToggle />
        </div>

        <nav class="space-y-2">
          <a href="/admin" class="admin-nav-item">
            Dashboard
          </a>
          <a href="/admin/products" class="admin-nav-item">
            Products
          </a>
          <a href="/admin/orders" class="admin-nav-item">
            Orders
          </a>
          <a href="/admin/blog" class="admin-nav-item">
            Blog
          </a>
          <a href="/admin/settings" class="admin-nav-item">
            Settings
          </a>
        </nav>

        {isPreview.value && (
          <div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              Preview Mode Active
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
