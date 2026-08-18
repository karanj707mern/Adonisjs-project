import { PrismaClient, Prisma } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';

export default class CatalogExtraService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  private sanitizeHtml(text: string | null): string | null {
    if (!text) return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  async addView(userId: number, productId: number) {
    await this.prisma.recentlyViewed.create({
      data: { userId, productId },
    });

    await this.cache.del(`recently-viewed:user:${userId}`);

    const count = await this.prisma.recentlyViewed.count({
      where: { userId },
    });

    const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    if (count > 50) {
      const oldest = await this.prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'asc' },
        take: Math.max(0, count - 50),
      });

      const ids = oldest.map((r) => r.id);
      if (ids.length > 0) {
        await this.prisma.recentlyViewed.deleteMany({
          where: { id: { in: ids } },
        });
      }
    }

    const entries = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });

    await this.cache.setJson(`recently-viewed:user:${userId}`, entries, 300);
    return entries;
  }

  async getRecentlyViewed(userId: number) {
    const cacheKey = `recently-viewed:user:${userId}`;
    const cached =
      await this.cache.getJson<{ productId: number; viewedAt: string }[]>(
        cacheKey,
      );
    if (cached) return cached;

    const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const entries = await this.prisma.recentlyViewed.findMany({
      where: { userId, viewedAt: { gt: threshold } },
      orderBy: { viewedAt: 'desc' },
      take: 50,
    });

    await this.cache.setJson(cacheKey, entries, 300);
    return entries;
  }

  async clearRecentlyViewed(userId: number) {
    await this.prisma.recentlyViewed.deleteMany({ where: { userId } });
    await this.cache.del(`recently-viewed:user:${userId}`);
  }

  async addAbandonedCart(
    userId: number | null,
    productId: number,
    quantity = 1,
    guestToken?: string,
  ) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.abandonedCart.create({
      data: {
        userId: userId ?? undefined,
        guestToken: guestToken ?? undefined,
        productId,
        quantity,
        recovered: false,
        expiresAt,
      },
    });

    const or: Prisma.AbandonedCartWhereInput[] = [];
    if (userId !== undefined) {
      or.push({ userId });
    }
    if (guestToken !== undefined) {
      or.push({ guestToken });
    }

    const entries = await this.prisma.abandonedCart.findMany({
      where: {
        OR: or,
        expiresAt: { gt: new Date() },
      },
    });

    await this.cache.setJson(
      `abandoned-cart:${userId || guestToken}`,
      entries,
      300,
    );
    return entries;
  }

  async getAbandonedCarts(userId: number | null, guestToken?: string) {
    const cacheKey = `abandoned-cart:${userId || guestToken}`;
    const cached =
      await this.cache.getJson<
        { userId: number | null; productId: number; quantity: number }[]
      >(cacheKey);
    if (cached) return cached;

    const or: Prisma.AbandonedCartWhereInput[] = [];
    if (userId !== undefined) {
      or.push({ userId });
    }
    if (guestToken !== undefined) {
      or.push({ guestToken });
    }

    const entries = await this.prisma.abandonedCart.findMany({
      where: {
        OR: or,
        expiresAt: { gt: new Date() },
      },
    });

    await this.cache.setJson(cacheKey, entries, 300);
    return entries;
  }

  async markCartRecovered(userId: number | null, guestToken?: string) {
    const or: Prisma.AbandonedCartWhereInput[] = [];
    if (userId !== undefined) {
      or.push({ userId });
    }
    if (guestToken !== undefined) {
      or.push({ guestToken });
    }

    await this.prisma.abandonedCart.updateMany({
      where: {
        OR: or,
        recovered: false,
      },
      data: {
        recovered: true,
        recoveredAt: new Date(),
      },
    });

    await this.cache.del(`abandoned-cart:${userId || guestToken}`);
  }
}
