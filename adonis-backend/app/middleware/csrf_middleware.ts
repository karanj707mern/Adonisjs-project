import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { randomUUID } from 'node:crypto'

/**
 * Replicates the NestJS CsrfMiddleware. Issues a `csrf-token` cookie for
 * state-changing flows and validates the `X-CSRF-Token` header on non-GET
 * requests when a token cookie is present.
 */
export async function csrfMiddleware(ctx: HttpContext, next: NextFn) {
  const tokenCookie = ctx.request.cookie('csrf-token')

  if (!tokenCookie) {
    ctx.response.cookie('csrf-token', randomUUID().replace(/-/g, ''), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }

  if (ctx.request.method() !== 'GET' && ctx.request.method() !== 'HEAD') {
    const headerToken = ctx.request.header('x-csrf-token')
    if (tokenCookie && headerToken && tokenCookie !== headerToken) {
      return ctx.response.status(403).json({ message: 'Invalid CSRF token' })
    }
  }

  await next()
}
