import { inject } from '@adonisjs/fold';
import type { PrismaClient } from '@prisma/client';
import AbandonedCartService from '#services/abandoned_cart_service';
import RedisCacheService from '#services/redis_cache_service';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'OUT_FOR_DELIVERY';

export default class AnalyticsService {
  private readonly defaultExpiryHours = 24 * 30;

  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
    private abandonedCartService: AbandonedCartService,
  ) {}

  async getSalesStats(query: { startDate?: string; endDate?: string }) {
    const statusFilter = [
      'PAID',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    const where: any = {
      status: { in: statusFilter },
    };

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate);
      }
      where.createdAt = dateFilter;
    }

    const [totalRevenue, codRevenue, onlineRevenue, orderCount] =
      await Promise.all([
        this.prisma.order.aggregate({
          where,
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: {
            ...where,
            paymentMethod: 'cod',
          },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: {
            ...where,
            paymentMethod: { not: 'cod' },
          },
          _sum: { total: true },
        }),
        this.prisma.order.count({ where }),
      ]);

    const statusBreakdown = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { total: true },
    });

    return {
      totalRevenue: Number(totalRevenue._sum.total) || 0,
      codRevenue: Number(codRevenue._sum.total) || 0,
      onlineRevenue: Number(onlineRevenue._sum.total) || 0,
      orderCount,
      statusBreakdown: statusBreakdown.map((row) => ({
        status: row.status,
        count: row._count._all,
        total: Number(row._sum.total) || 0,
      })),
    };
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
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'SHIPPED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
    ]);

    return {
      pending: pendingCount,
      paid: paidCount,
      shipped: shippedCount,
      delivered: deliveredCount,
      outForDelivery: outForDeliveryCount,
      cancelled: cancelledCount,
    };
  }

  async createFromCart(
    userId: number | undefined,
    guestToken: string | undefined,
    items: { productId: number; quantity: number }[],
    expiryHours?: number,
  ) {
    return this.abandonedCartService.createFromCart(userId, guestToken, items, expiryHours);
  }

  async getRecoverableCarts(userId: number | undefined, guestToken: string | undefined) {
    return this.abandonedCartService.getRecoverableCarts(userId, guestToken);
  }

  async markRecovered(userId: number | undefined, guestToken?: string) {
    return this.abandonedCartService.markRecovered(userId, guestToken);
  }

  async runAbandonedCartSweep() {
    return this.abandonedCartService.cleanupExpired();
  }

  async cleanupExpired() {
    return this.abandonedCartService.cleanupExpired();
  }

  async recordView(userId: number, productId: number) {
    await this.prisma.recentlyViewed.create({
      data: { userId, productId },
    });

    await this.cache.del(`recently-viewed:user:${userId}`);

    const count = await this.prisma.recentlyViewed.count({
      where: { userId },
    });

    if (count > 50) {
      const overflow = count - 50;
      const oldest = await this.prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'asc' },
        take: overflow,
        select: { id: true },
      });

      const ids = oldest.map((row) => row.id);
      if (ids.length > 0) {
        await this.prisma.recentlyViewed.deleteMany({
          where: { id: { in: ids } },
        });
      }
    }
  }

  async getRecentlyViewed(userId: number, limit = 20) {
    const cacheKey = `recently-viewed:user:${userId}`;
    const cached = await this.cache.getJson<
      {
        id: number;
        name: string;
        price: number;
        image: string | null;
        stock: number;
        slug: string;
      }[]
    >(cacheKey);
    if (cached) {
      return cached;
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
    });

    const products = entries.map((entry) => entry.product);

    await this.cache.setJson(cacheKey, products, 300);
    return products;
  }

  async clearHistory(userId: number) {
    await this.prisma.recentlyViewed.deleteMany({
      where: { userId },
    });

    await this.cache.del(`recently-viewed:user:${userId}`);
  }
}
