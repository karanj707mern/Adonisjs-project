import { PrismaClient } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@adonisjs/core/http';
import { RedisCacheService } from '#services/redis_cache_service';

export default class WishlistService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  private generateGuestToken(): string {
    throw new Error('Guest token generation not supported via Database');
  }

  private getGuestWishlistExpiryThreshold(): Date {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  }

  async mergeGuestWishlist(userId: number, token: string) {
    if (!token) {
      throw new BadRequestException('Guest wishlist token is required');
    }

    const guestItems = await this.prisma.wishlist.findMany({
      where: {
        guestWishlistToken: token,
        createdAt: { gt: this.getGuestWishlistExpiryThreshold() },
      },
      select: { productId: true },
    });

    if (guestItems.length === 0) {
      return { message: 'No guest wishlist items to merge' };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of guestItems) {
        const existing = await tx.wishlist.findFirst({
          where: { userId, productId: item.productId },
        });

        if (existing) {
          await tx.wishlist.update({
            where: { id: existing.id },
            data: {},
          });
        } else {
          await tx.wishlist.create({
            data: { userId, productId: item.productId },
          });
        }
      }

      await tx.wishlist.deleteMany({
        where: {
          guestWishlistToken: token,
          createdAt: { gt: this.getGuestWishlistExpiryThreshold() },
        },
      });
    });

    await this.cache.del(`wishlist:user:${userId}`);
    await this.cache.del(`wishlist:guest:${token}`);

    return this.findAll(userId);
  }

  async findAll(userId: number) {
    const cacheKey = `wishlist:user:${userId}`;
    const cached =
      await this.cache.getJson<{ productId: number; createdAt: string }[]>(
        cacheKey,
      );
    if (cached) return cached;

    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true, createdAt: true },
    });

    await this.cache.setJson(cacheKey, items, 300);
    return items;
  }

  async findOne(userId: number, productId: number) {
    const item = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    return item;
  }

  async add(userId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return existing;
    }

    await this.prisma.wishlist.create({
      data: { userId, productId },
    });

    await this.cache.del(`wishlist:user:${userId}`);

    return this.findOne(userId, productId);
  }

  async remove(userId: number, productId: number) {
    const item = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.prisma.wishlist.delete({
      where: { id: item.id },
    });

    await this.cache.del(`wishlist:user:${userId}`);

    return { message: 'Wishlist item removed' };
  }

  async clear(userId: number) {
    await this.prisma.wishlist.deleteMany({
      where: { userId },
    });

    await this.cache.del(`wishlist:user:${userId}`);

    return [];
  }
}
