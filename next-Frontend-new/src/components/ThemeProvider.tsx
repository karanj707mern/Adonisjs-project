import { component$, useContextProvider, createContextId, useSignal, useVisibleTask$ } from '@builder.io/qwik'

export const ThemeContext = createContextId<{
  theme: 'light' | 'dark'
  toggle: () => void
}>('theme-context')

export const ThemeProvider = component$(() => {
  const theme = useSignal<'light' | 'dark'>('light')

  useVisibleTask$(() => {
    const stored = localStorage.getItem('theme')
    if (stored) {
      theme.value = stored as 'light' | 'dark'
      document.documentElement.setAttribute('data-theme', stored)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark'
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  })

  const toggle = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useContextProvider(ThemeContext, { theme, toggle })

  return <Slot />
})
