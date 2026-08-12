import { component$ } from '@builder.io/qwik'
import { ThemeProvider } from './ThemeProvider'

export const ThemeScript = component$(() => {
  return (
    <ThemeProvider>
      <script
        dangerouslySetInnerHTML={`(function() {
          try {
            var theme = localStorage.getItem('theme');
            if (!theme) {
              theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
          } catch (e) {}
        })();`}
      />
    </ThemeProvider>
  )
})
