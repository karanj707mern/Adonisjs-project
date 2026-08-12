import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { api } from '~lib/api-client'

export const NewArrivalsCarousel = component$(() => {
  const arrivals = useSignal<any[]>([])

  useVisibleTask$(async () => {
    try {
      const response = await api.hero.getActive()
      arrivals.value = response.data
    } catch {
      // Handle error
    }
  })

  return (
    <div class="relative overflow-hidden">
      <div class="flex transition-transform duration-500" style={{ transform: `translateX(-${arrivals.value.length * 0}px)` }}>
        {arrivals.value.map((arrival, index) => (
          <div key={arrival.id || index} class="w-full flex-shrink-0">
            <img
              src={arrival.url}
              alt={arrival.alt}
              class="w-full h-64 md:h-96 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
})
