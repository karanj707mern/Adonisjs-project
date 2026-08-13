import { inject, injectable } from '@adonisjs/fold'
import type { PrismaClient, OrderStatus } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'

@injectable()
export default class AnalyticsService {
  private readonly defaultExpiryHours = 24 * 30

  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('RedisCache') private cache: RedisCacheService,
  ) {}

  async getSalesStats(query: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {
      status: {
        in: [
          'PAID',
          'SHIPPED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED',
        ] as OrderStatus[],
      },
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate)
      }
      where.createdAt = dateFilter
    }

    const [totalRevenue, codRevenue, onlineRevenue, orderCount] = await Promise.all([
      this.prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { ...where, paymentMethod: 'cod' },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { ...where, paymentMethod: { not: 'cod' } },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where }),
    ])

    const statusBreakdown = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
      _sum: { total: true },
    })

    return {
      totalRevenue: totalRevenue._sum.total ?? 0,
      codRevenue: codRevenue._sum.total ?? 0,
      onlineRevenue: onlineRevenue._sum.total ?? 0,
      orderCount,
      statusBreakdown: statusBreakdown.map((row) => ({
        status: row.status,
        count: row._count.id,
        total: row._sum.total ?? 0,
      })),
    }
  }

  async getOrdersOverview() {
    const [
      pendingCount,
      paidCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      outForDeliveryCount,
    ] = await Promise.all([
      this.prisma.order.count({ where: { status: 'PENDING' as OrderStatus } }),
      this.prisma.order.count({ where: { status: 'PAID' as OrderStatus } }),
      this.prisma.order.count({ where: { status: 'SHIPPED' as OrderStatus } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' as OrderStatus } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' as OrderStatus } }),
      this.prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' as OrderStatus } }),
    ])

    return {
      pending: pendingCount,
      paid: paidCount,
      shipped: shippedCount,
      delivered: deliveredCount,
      outForDelivery: outForDeliveryCount,
      cancelled: cancelledCount,
    }
  }

  async createFromCart(
    userId: number | undefined,
    guestToken: string | undefined,
    items: { productId: number; quantity: number }[],
    expiryHours?: number,
  ) {
    const resolvedExpiry = expiryHours ?? this.defaultExpiryHours
    const expiresAt = new Date(Date.now() + resolvedExpiry * 60 * 60 * 1000)

    await this.prisma.abandonedCart.createMany({
      data: items.map((item) => ({
        userId: userId ?? null,
        guestToken: guestToken ?? null,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
      })),
    })
  }

  async getRecoverableCarts(
    userId: number | undefined,
    guestToken: string | undefined,
  ) {
    const now = new Date()
    const where: Record<string, unknown> = {
      recovered: false,
      expiresAt: { gt: now },
    }

    if (userId !== undefined) {
      where.userId = userId
    } else if (guestToken) {
      where.guestToken = guestToken
    } else {
      return []
    }

    return this.prisma.abandonedCart.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            slug: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async markRecovered(userId: number | undefined, guestToken?: string) {
    const where: Record<string, unknown> = {
      recovered: false,
    }

    if (userId) {
      where.userId = userId
    } else if (guestToken) {
      where.guestToken = guestToken
    } else {
      return
    }

    await this.prisma.abandonedCart.updateMany({
      where,
      data: {
        recovered: true,
        recoveredAt: new Date(),
      },
    })
  }

  async runAbandonedCartSweep() {
    const now = new Date()
    const result = await this.prisma.abandonedCart.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    })
    return { deleted: result.count }
  }

  async cleanupExpired() {
    const now = new Date()
    await this.prisma.abandonedCart.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    })
  }

  async recordView(userId: number, productId: number) {
    await this.prisma.recentlyViewed.create({
      data: { userId, productId },
    })

    await this.cache.del(`recently-viewed:user:${userId}`)

    const count = await this.prisma.recentlyViewed.count({
      where: { userId },
    })

    if (count > 50) {
      const overflow = count - 50
      const oldest = await this.prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'asc' },
        take: overflow,
        select: { id: true },
      })

      await this.prisma.recentlyViewed.deleteMany({
        where: { id: { in: oldest.map((row) => row.id) } },
      })
    }
  }

  async getRecentlyViewed(userId: number, limit = 20) {
    const cacheKey = `recently-viewed:user:${userId}`
    const cached = await this.cache.getJson<
      {
        id: number
        name: string
        price: number
        image: string | null
        stock: number
        slug: string
      }[]
    >(cacheKey)
    if (cached) {
      return cached
    }

    const entries = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            slug: true,
          },
        },
      },
    })

    const result = entries
      .map((entry) => entry.product)
      .filter(
        (product): product is {
          id: number
          name: string
          price: number
          image: string | null
          stock: number
          slug: string
        } => product !== null,
      )

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async clearHistory(userId: number) {
    await this.prisma.recentlyViewed.deleteMany({
      where: { userId },
    })

    await this.cache.del(`recently-viewed:user:${userId}`)
  }
}
