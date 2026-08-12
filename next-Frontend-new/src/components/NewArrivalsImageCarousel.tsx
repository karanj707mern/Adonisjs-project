import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { api } from '~lib/api-client'

export const NewArrivalsImageCarousel = component$(() => {
  const images = useSignal<string[]>([])

  useVisibleTask$(async () => {
    try {
      const response = await api.hero.getActive()
      images.value = response.data.map((h: any) => h.url)
    } catch {
      // Handle error
    }
  })

  return (
    <div class="relative">
      {images.value.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`New arrival ${index + 1}`}
          class="w-full h-64 object-cover rounded-xl"
        />
      ))}
    </div>
  )
})
