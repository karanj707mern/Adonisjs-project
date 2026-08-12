import { component$ } from '@builder.io/qwik'

interface HeaderProps {
  title: string
  subtitle?: string
}

export const Header = component$<HeaderProps>((props) => {
  return (
    <div class="text-center py-12">
      <h1 class="text-4xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 mb-4">
        {props.title}
      </h1>
      {props.subtitle && (
        <p class="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          {props.subtitle}
        </p>
      )}
    </div>
  )
})
