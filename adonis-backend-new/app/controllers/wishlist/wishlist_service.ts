/**
 * Wishlist Service — AdonisJS v7
 *
 * Full guest token support ported from Moringa-Backend (NestJS).
 * Anonymous users can maintain wishlists via guest_token cookie.
 * Guest wishlists merge into user wishlist on login/merge.
 */
import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'node:crypto';
import {
  BadRequestException,
  NotFoundException,
} from '#exceptions/http_exceptions';
import RedisCacheService from '#services/redis_cache_service';

@inject()
export default class WishlistService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  private generateGuestToken(): string {
    return crypto.randomUUID();
  }

  private getGuestWishlistExpiryThreshold(): Date {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  }

  async getOrCreateGuestToken(existingToken?: string): Promise<string> {
    if (existingToken) {
      return existingToken;
    }
    return this.generateGuestToken();
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
        await tx.wishlist.upsert({
          where: {
            userId_productId: {
              userId,
              productId: item.productId,
            },
          },
          update: {},
          create: {
            userId,
            productId: item.productId,
          },
        });
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

    return { message: 'Guest wishlist merged' };
  }

  async findAll(userId: number | undefined, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    const cacheKey =
      userId !== undefined
        ? `wishlist:user:${userId}`
        : `wishlist:guest:${guestToken}`;

    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (userId !== undefined) {
      const items = await this.prisma.wishlist.findMany({
        where: {
          userId,
          product: { isActive: true },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              stock: true,
              slug: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = items.map((item) => item.product);
      await this.cache.setJson(cacheKey, result, 300);
      return result;
    }

    const items = await this.prisma.wishlist.findMany({
      where: {
        guestWishlistToken: guestToken!,
        createdAt: { gt: this.getGuestWishlistExpiryThreshold() },
        product: { isActive: true },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            slug: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = items.map((item) => item.product);
    await this.cache.setJson(cacheKey, result, 300);
    return result;
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

  async add(
    userId: number | undefined,
    productId: number,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (userId !== undefined) {
      await this.prisma.wishlist.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        update: {},
        create: {
          userId,
          productId,
        },
      });

      await this.cache.del(`wishlist:user:${userId}`);
      return { message: 'Added to wishlist' };
    }

    await this.prisma.wishlist.upsert({
      where: {
        guestWishlistToken_productId: {
          guestWishlistToken: guestToken!,
          productId,
        },
      },
      update: {},
      create: {
        productId,
        guestWishlistToken: guestToken!,
      },
    });

    await this.cache.del(`wishlist:guest:${guestToken}`);
    return { message: 'Added to wishlist' };
  }

  async remove(
    userId: number | undefined,
    productId: number,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.prisma.wishlist.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      await this.cache.del(`wishlist:user:${userId}`);
      return { message: 'Removed from wishlist' };
    }

    await this.prisma.wishlist.deleteMany({
      where: {
        guestWishlistToken: guestToken!,
        productId,
      },
    });

    await this.cache.del(`wishlist:guest:${guestToken}`);
    return { message: 'Removed from wishlist' };
  }

  async clear(userId: number | undefined, guestToken?: string) {
    if (userId !== undefined) {
      await this.prisma.wishlist.deleteMany({
        where: { userId },
      });
      await this.cache.del(`wishlist:user:${userId}`);
      return [];
    }

    if (guestToken) {
      return this.clearGuestWishlist(guestToken);
    }

    return [];
  }

  async clearGuestWishlist(token: string) {
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

    if (guestItems.length > 0) {
      await this.prisma.wishlist.deleteMany({
        where: {
          guestWishlistToken: token,
          createdAt: { gt: this.getGuestWishlistExpiryThreshold() },
        },
      });
    }

    await this.cache.del(`wishlist:guest:${token}`);
    return { message: 'Guest wishlist cleared' };
  }
}
