import env from '#adonisjs/env'
import { defineConfig } from '@adonisjs/session'

export default defineConfig({
  driver: 'cookie',
  cookieName: 'session',
  maxAge: '24h',
  domain: env.get('NODE_ENV') === 'production' ? '.moringa.com' : undefined,
  secure: env.get('NODE_ENV') === 'production',
  httpOnly: true,
  sameSite: env.get('NODE_ENV') === 'production' ? 'none' : 'lax',
})
