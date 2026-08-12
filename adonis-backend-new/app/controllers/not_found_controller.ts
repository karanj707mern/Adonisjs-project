import type { HttpContext } from '@adonisjs/core/http'

export default class NotFoundController {
  async notFound({ response }: HttpContext) {
    return response.status(404).json({
      statusCode: 404,
      message: 'Not Found',
    })
  }
}
