import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
/**
 * Replicates the NestJS RolesGuard restricted to ADMIN. Expects AuthMiddleware
 * to have run first and populated `ctx.auth`.
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = (ctx as any).auth?.user
    if (!user) {
      throw { status: 401, message: 'Authentication required' }
    }
    if (user.role !== 'ADMIN') {
      throw { status: 403, message: 'Admin access required' }
    }
    await next()
  }
}
