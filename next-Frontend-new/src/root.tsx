import { component$, Slot } from '@builder.io/qwik'
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city'
import { ThemeProvider } from './components/ThemeProvider'
import { ToastProvider } from './components/ToastProvider'
import { SessionHydrator } from './components/SessionHydrator'
import './styles/global.css'

export const Root = component$(() => {
  return (
    <QwikCityProvider>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="manifest" href="/manifest.webmanifest" />
        </head>
        <body>
          <ThemeProvider>
            <ToastProvider>
              <SessionHydrator />
              <RouterOutlet />
              <ServiceWorkerRegister />
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </QwikCityProvider>
  )
})
