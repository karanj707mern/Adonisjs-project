import { component$ } from '@builder.io/qwik'

interface AnimatedStatProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
}

export const AnimatedStat = component$<AnimatedStatProps>((props) => {
  return (
    <div class="text-center">
      <div class="text-4xl font-bold text-primary-600 mb-2">
        {props.prefix}
        {props.value.toLocaleString()}
        {props.suffix}
      </div>
      <div class="text-sm text-stone-600 dark:text-stone-400">
        {props.label}
      </div>
    </div>
  )
})
