import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'

export default defineConfig({
  site: process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:3000',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: { entrypoint: 'astro/assets/services/noop' },
  },
  server: { port: Number(process.env.PORT || 3000) },
  experimental: { contentIntellisense: true },
  output: 'server',
  adapter: node({ mode: 'server' }),
})
