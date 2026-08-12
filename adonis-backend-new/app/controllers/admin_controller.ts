import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class AdminController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async overview({ response }: HttpContext) {
    const [totalOrders, totalRevenue, totalProducts, totalCustomers] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'PAID' },
      }),
      this.prisma.product.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
    ])

    return response.json({
      statusCode: 200,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        totalCustomers,
      },
    })
  }
}
