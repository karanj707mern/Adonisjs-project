import { defineConfig } from '@adonisjs/static'

export default defineConfig({
  enabled: true,
  etag: true,
  lastModified: true,
  dotFiles: false,
  sendFile: true,
  maxAge: 0,
  headers: {},
})
