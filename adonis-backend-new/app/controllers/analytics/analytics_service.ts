import { inject, injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'OUT_FOR_DELIVERY'

@injectable()
export default class AnalyticsService {
  private readonly defaultExpiryHours = 24 * 30

  constructor(
    private db: Database,
    private cache: RedisCacheService,
  ) {}

  async getSalesStats(query: { startDate?: string; endDate?: string }) {
    const statusFilter = [
      'PAID',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ]

    const whereClause: Record<string, unknown> = {
      status: statusFilter,
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate)
      }
      whereClause.created_at = dateFilter
    }

    const [totalRevenue, codRevenue, onlineRevenue, orderCount] =
      await Promise.all([
        this.db
          .table('orders')
          .where(whereClause)
          .sum('total as total')
          .first(),
        this.db
          .table('orders')
          .where((qb) => {
            qb.where(whereClause).andWhere('payment_method', 'cod')
          })
          .sum('total as total')
          .first(),
        this.db
          .table('orders')
          .where((qb) => {
            qb.where(whereClause).andWhere('payment_method', '!=', 'cod')
          })
          .sum('total as total')
          .first(),
        this.db.table('orders').where(whereClause).count('id as total'),
      ])

    const statusBreakdown = await this.db
      .table('orders')
      .where(whereClause)
      .groupBy('status')
      .select('status')
      .count('id as count')
      .sum('total as total')

    return {
      totalRevenue: Number((totalRevenue as any).total) || 0,
      codRevenue: Number((codRevenue as any).total) || 0,
      onlineRevenue: Number((onlineRevenue as any).total) || 0,
      orderCount: (orderCount as any)[0]?.total || 0,
      statusBreakdown: statusBreakdown.map((row: any) => ({
        status: row.status,
        count: Number(row.count),
        total: Number(row.total) || 0,
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
      this.db.table('orders').where('status', 'PENDING').count('id as total'),
      this.db.table('orders').where('status', 'PAID').count('id as total'),
      this.db.table('orders').where('status', 'SHIPPED').count('id as total'),
      this.db.table('orders').where('status', 'DELIVERED').count('id as total'),
      this.db.table('orders').where('status', 'CANCELLED').count('id as total'),
      this.db
        .table('orders')
        .where('status', 'OUT_FOR_DELIVERY')
        .count('id as total'),
    ])

    return {
      pending: (pendingCount as any)[0]?.total || 0,
      paid: (paidCount as any)[0]?.total || 0,
      shipped: (shippedCount as any)[0]?.total || 0,
      delivered: (deliveredCount as any)[0]?.total || 0,
      outForDelivery: (outForDeliveryCount as any)[0]?.total || 0,
      cancelled: (cancelledCount as any)[0]?.total || 0,
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

    const rows = items.map((item) => ({
      user_id: userId ?? null,
      guest_token: guestToken ?? null,
      product_id: item.productId,
      quantity: item.quantity,
      expires_at: expiresAt,
    }))

    for (const row of rows) {
      await this.db.table('abandoned_carts').insert(row)
    }
  }

  async getRecoverableCarts(
    userId: number | undefined,
    guestToken: string | undefined,
  ) {
    const now = new Date()

    if (userId !== undefined) {
      const entries = await this.db
        .table('abandoned_carts')
        .where('user_id', userId)
        .where('recovered', false)
        .where('expires_at', '>', now)
        .orderBy('created_at', 'desc')

      return entries
    }

    if (guestToken) {
      const entries = await this.db
        .table('abandoned_carts')
        .where('guest_token', guestToken)
        .where('recovered', false)
        .where('expires_at', '>', now)
        .orderBy('created_at', 'desc')

      return entries
    }

    return []
  }

  async markRecovered(userId: number | undefined, guestToken?: string) {
    if (userId) {
      await this.db
        .table('abandoned_carts')
        .where('user_id', userId)
        .where('recovered', false)
        .update({ recovered: true, recovered_at: new Date() })
    } else if (guestToken) {
      await this.db
        .table('abandoned_carts')
        .where('guest_token', guestToken)
        .where('recovered', false)
        .update({ recovered: true, recovered_at: new Date() })
    }
  }

  async runAbandonedCartSweep() {
    const now = new Date()
    const result = await this.db
      .table('abandoned_carts')
      .where('expires_at', '<=', now)
      .delete()

    return { deleted: result.length }
  }

  async cleanupExpired() {
    const now = new Date()
    await this.db
      .table('abandoned_carts')
      .where('expires_at', '<=', now)
      .delete()
  }

  async recordView(userId: number, productId: number) {
    await this.db.table('recently_viewed').insert({
      user_id: userId,
      product_id: productId,
    })

    await this.cache.del(`recently-viewed:user:${userId}`)

    const count = await this.db
      .table('recently_viewed')
      .where('user_id', userId)
      .count('id as total')

    const total = (count[0] as any).total || 0

    if (total > 50) {
      const overflow = total - 50
      const oldest = await this.db
        .table('recently_viewed')
        .where('user_id', userId)
        .orderBy('viewed_at', 'asc')
        .limit(overflow)
        .select('id')

      const ids = oldest.map((row: any) => row.id)
      if (ids.length > 0) {
        await this.db.table('recently_viewed').whereIn('id', ids).delete()
      }
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

    const entries = await this.db
      .table('recently_viewed')
      .where('user_id', userId)
      .orderBy('viewed_at', 'desc')
      .limit(limit)
      .join('products', 'recently_viewed.product_id', 'products.id')
      .select(
        'products.id',
        'products.name',
        'products.price',
        'products.image',
        'products.stock',
        'products.slug',
      )

    await this.cache.setJson(cacheKey, entries, 300)
    return entries
  }

  async clearHistory(userId: number) {
    await this.db.table('recently_viewed').where('user_id', userId).delete()

    await this.cache.del(`recently-viewed:user:${userId}`)
  }
}
