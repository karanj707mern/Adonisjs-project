import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class HealthController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ response }: HttpContext) {
    try {
      await this.prisma.$queryRaw`SELECT 1`

      return response.json({
        statusCode: 200,
        message: 'OK',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'up',
          },
        },
      })
    } catch (error) {
      return response.status(503).json({
        statusCode: 503,
        message: 'Service Unavailable',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'down',
          },
        },
      })
    }
  }
}
