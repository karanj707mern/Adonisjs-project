import type { HttpContext } from '@adonisjs/core/http'

export default class CsrfMiddleware {
  async handle({ request, response, session }: HttpContext, next: () => Promise<void>) {
    const method = request.method()
    
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next()
    }

    const csrfToken = request.header('x-csrf-token') || request.input('_csrf')
    const sessionToken = session.get('csrf-token')

    if (!csrfToken || csrfToken !== sessionToken) {
      return response.status(403).json({
        statusCode: 403,
        message: 'Invalid CSRF token',
        timestamp: new Date().toISOString(),
      })
    }

    await next()
  }
}
