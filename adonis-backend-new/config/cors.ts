import { defineConfig } from '#adonisjs/cors'

export default defineConfig({
  origin: (origin) => {
    const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
    if (!origin) return true
    const normalized = origin.replace(/\/$/, '')
    return origins.some((allowed) => {
      const na = allowed.replace(/\/$/, '')
      if (na === normalized) return true
      if (na.includes('*')) {
        const pattern = na.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')
        return new RegExp(`^${pattern}$`).test(normalized)
      }
      return false
    })
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Guest-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
})
