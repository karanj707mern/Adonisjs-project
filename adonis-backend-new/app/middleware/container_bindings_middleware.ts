import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Binds Prisma and other services into the request container so downstream
 * code can access them via `ctx.container.make(...)` or `ctx Prisma`.
 */
export default class ContainerBindingsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.container.bind('Prisma', () => ctx.app.container.make('Prisma'))
    return next()
  }
}
