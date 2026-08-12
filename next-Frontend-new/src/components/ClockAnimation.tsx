import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'

export const ClockAnimation = component$(() => {
  const time = useSignal(new Date())

  useVisibleTask$(({ cleanup }) => {
    const interval = setInterval(() => {
      time.value = new Date()
    }, 1000)

    cleanup(() => clearInterval(interval))
  })

  return (
    <div class="text-center">
      <div class="text-6xl font-mono font-bold text-primary-600">
        {time.value.toLocaleTimeString()}
      </div>
      <div class="text-lg text-stone-600 dark:text-stone-400 mt-2">
        {time.value.toLocaleDateString()}
      </div>
    </div>
  )
})
