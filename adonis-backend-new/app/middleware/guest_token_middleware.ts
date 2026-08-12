import type { HttpContext } from '@adonisjs/core/http'
import { v4 as uuidv4 } from 'uuid'

export default class GuestTokenMiddleware {
  async handle({ request, next }: HttpContext, next: () => Promise<void>) {
    const guestToken = request.header('x-guest-token') || request.cookie('guest_token')
    
    if (!guestToken) {
      const newToken = uuidv4()
      request.cookie('guest_token', newToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      request.guestToken = newToken
    } else {
      request.guestToken = guestToken
    }

    await next()
  }
}
