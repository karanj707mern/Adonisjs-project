import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'

export default class RequestContextMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    const requestId = request.header('x-request-id') || cuid()
    request.requestId = requestId
    response.header('x-request-id', requestId)
    await next()
  }
}
