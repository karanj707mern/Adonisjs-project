import limiter from '@adonisjs/limiter/services/main'
import type { HttpContext } from '@adonisjs/core/http'

export const throttle = limiter.define('global', async (_ctx: HttpContext) => {
  return limiter.allowRequests(100).every('1 minute') as any
})

export const authLimiter = limiter.define('auth', async (_ctx: HttpContext) => {
  return limiter.allowRequests(5).every('1 minute') as any
})
