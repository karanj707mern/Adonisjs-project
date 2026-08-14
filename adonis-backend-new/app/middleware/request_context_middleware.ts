import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { randomUUID } from 'node:crypto'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    requestId: string
    auth?: {
      user: {
        id: number
        role: string
        [key: string]: any
      }
    }
    guestToken?: string
  }
}

/**
 * Replicates the NestJS RequestContextMiddleware. Assigns a request id and a
 * per-request logger binding so downstream code can correlate logs.
 */
export default class RequestContextMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.requestId = (ctx.request.header('x-request-id') || randomUUID()) as string
    await next()
  }
}
