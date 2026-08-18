import { component$, Slot } from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";
import { ThemeScript } from "./components/theme-script";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/toaster";

import "./global.css";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link
          rel="preconnect"
          href="https://my-nest-project-pearl.vercel.app"
        />
        <ThemeScript />
        <RouterHead />
      </head>
      <body lang="en">
        <a
          href="#main-content"
          class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <RouterOutlet />
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
