import type { HttpContext } from '@adonisjs/core/http'
import { ForbiddenException } from '@adonisjs/core/exceptions'

export default class AdminMiddleware {
  async handle({ request }: HttpContext, next: () => Promise<void>) {
    const user = request.user as any
    
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied. Admin only.')
    }

    await next()
  }
}
