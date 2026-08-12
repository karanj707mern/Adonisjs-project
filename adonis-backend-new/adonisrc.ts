import { defineConfig, providers } from '@adonisjs/core'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '5000', 10),
    driver: providers.fastify,
  },

  appKey: process.env.APP_KEY || 'app-key-change-me-in-production',

  cors: {
    origin: (origin: string | undefined) => {
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
  },

  session: {
    driver: 'cookie',
    cookieName: 'session',
    maxAge: '24h',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
  },

  shield: {
    enable: process.env.NODE_ENV !== 'test',
    xss: {
      enable: true,
    },
    csrf: {
      enable: true,
      methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      filter: (request) => {
        const path = request.path()
        return !path.includes('/webhook/')
      },
    },
  },
})
