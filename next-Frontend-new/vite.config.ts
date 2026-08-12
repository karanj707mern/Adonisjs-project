import { defineConfig } from 'vite'
import { qwikCity } from '@builder.io/qwik-city/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig(() => ({
  plugins: [qwikCity(), tsconfigPaths()],
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
}))
