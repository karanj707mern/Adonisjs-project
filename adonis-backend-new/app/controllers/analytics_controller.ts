import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class AnalyticsController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async recentlyViewed({ auth, response }: HttpContext) {
    const user = auth.user as any

    const viewed = await this.prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    })

    return response.json({
      statusCode: 200,
      data: viewed,
    })
  }

  async abandonedCarts({ response }: HttpContext) {
    const abandoned = await this.prisma.abandonedCart.findMany({
      where: { recovered: false },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: abandoned,
    })
  }
}
