import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'

export const useSettings = routeLoader$(async () => {
  try {
    const response = await api.settings.get()
    return response.data
  } catch {
    return null
  }
})

export default component$(() => {
  const settings = useSettings()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  return (
    <div>
      <h1 class="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-8">
        Store Settings
      </h1>

      {loading.value ? (
        <div class="skeleton h-64 rounded-xl" />
      ) : (
        <div class="card">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Shipping Charge (₹)
              </label>
              <input
                type="number"
                class="input-field"
                value={settings.value?.shippingCharge || 50}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                class="input-field"
                value={((settings.value?.taxRate || 0.05) * 100).toFixed(2)}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                class="input-field"
                value={settings.value?.freeShippingThreshold || 999}
              />
            </div>

            <button class="btn btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Settings - Admin - Moringa Store',
}
