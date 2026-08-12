import { component$, useContext } from '@builder.io/qwik'
import { ThemeContext } from './ThemeProvider'

export const ThemeToggle = component$(() => {
  const theme = useContext(ThemeContext)

  return (
    <button
      onClick$={theme.toggle}
      class="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
    >
      {theme.theme.value === 'light' ? '🌙' : '☀️'}
    </button>
  )
})
