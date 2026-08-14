import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(100).every('1 minute')
})

export const authLimiter = limiter.define('auth', () => {
  return limiter.allowRequests(5).every('1 minute')
})
