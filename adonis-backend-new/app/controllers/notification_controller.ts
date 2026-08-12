import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class NotificationController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ auth, response }: HttpContext) {
    const user = auth.user as any

    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return response.json({
      statusCode: 200,
      data: notifications,
    })
  }

  async unreadCount({ auth, response }: HttpContext) {
    const user = auth.user as any

    const count = await this.prisma.notification.count({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    })

    return response.json({
      statusCode: 200,
      data: { count },
    })
  }

  async markRead({ auth, params, response }: HttpContext) {
    await this.prisma.notification.update({
      where: { id: parseInt(params.id) },
      data: { status: 'SENT' },
    })

    return response.json({
      statusCode: 200,
      message: 'Notification marked as read',
    })
  }
}
