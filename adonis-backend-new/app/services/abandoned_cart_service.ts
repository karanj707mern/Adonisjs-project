import { inject } from '@adonisjs/fold';
import type { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';

export default class AbandonedCartService {
  private readonly defaultExpiryHours = 24 * 30;

  constructor(
    @inject('Database') private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  async createFromCart(
    userId: number | undefined,
    guestToken: string | undefined,
    items: { productId: number; quantity: number }[],
    expiryHours = this.defaultExpiryHours,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    await this.prisma.abandonedCart.createMany({
      data: items.map((item) => ({
        userId: userId ?? null,
        guestToken: guestToken ?? null,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
      })),
    });
  }

  async getRecoverableCarts(
    userId: number | undefined,
    guestToken: string | undefined,
  ) {
    const now = new Date();
    const where: any = {
      recovered: false,
      expiresAt: { gt: now },
    };

    if (userId !== undefined) {
      where.userId = userId;
    } else if (guestToken) {
      where.guestToken = guestToken;
    } else {
      return [];
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
    });
  }

  async markRecovered(
    userId: number | undefined,
    guestToken?: string,
  ): Promise<void> {
    const where: any = { recovered: false };

    if (userId) {
      where.userId = userId;
    } else if (guestToken) {
      where.guestToken = guestToken;
    } else {
      return;
    }

    await this.prisma.abandonedCart.updateMany({
      where,
      data: { recovered: true, recoveredAt: new Date() },
    });
  }

  async cleanupExpired(): Promise<void> {
    const now = new Date();
    await this.prisma.abandonedCart.deleteMany({
      where: { expiresAt: { lte: now } },
    });
  }
}
