import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  site: process.env.SITE_URL || process.env.PUBLIC_SITE_URL || '',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('src'),
        '~components': path.resolve('components'),
        '~lib': path.resolve('lib'),
        '~hooks': path.resolve('hooks'),
      },
    },
  },
  server: { port: Number(process.env.PORT || 3000) },
  experimental: { contentIntellisense: true },
})
