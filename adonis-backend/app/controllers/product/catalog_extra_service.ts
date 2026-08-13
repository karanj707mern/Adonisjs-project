import { injectable } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'
import { NotFoundException } from '@adonisjs/core/http'

@injectable()
export default class CatalogExtraService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('RedisCache') private cache: RedisCacheService,
  ) {}

  private sanitizeHtml(text: string | null): string | null {
    if (!text) return text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  async addView(userId: number, productId: number) {
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
    const cached = await this.cache.getJson<any[]>(cacheKey)
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
      .filter((product) => product !== null)

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async clearHistory(userId: number) {
    await this.prisma.recentlyViewed.deleteMany({
      where: { userId },
    })

    await this.cache.del(`recently-viewed:user:${userId}`)
  }

  async createFromCart(
    userId: number | undefined,
    guestToken: string | undefined,
    items: { productId: number; quantity: number }[],
    expiryHours = 24 * 30
  ) {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

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
    guestToken: string | undefined
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

  async cleanupExpired() {
    const now = new Date()

    await this.prisma.abandonedCart.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    })
  }
}
