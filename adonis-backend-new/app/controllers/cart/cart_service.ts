import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';
import {
  BadRequestException,
  NotFoundException,
} from '#exceptions/http_exceptions';
import { RedisCacheService } from '#services/redis_cache_service';
import crypto from 'node:crypto';

interface GuestCartItem {
  productId: number;
  quantity: number;
}

export default class CartService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  private generateGuestToken(): string {
    return crypto.randomUUID();
  }

  private getGuestCartExpiryThreshold(): Date {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  }

  private validateQuantityAgainstStock(
    product: { name: string; stock: number },
    quantity: number,
  ) {
    if (product.stock <= 0) {
      throw new BadRequestException(
        `${product.name} is currently out of stock.`,
      );
    }
    if (quantity > product.stock) {
      throw new BadRequestException(
        `${product.name} has only ${product.stock} item(s) available right now.`,
      );
    }
  }

  private async ensureCustomerAccount(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admin accounts cannot use the cart.');
    }
  }

  async create(
    userId: number | undefined,
    productId: number,
    quantity = 1,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (userId !== undefined) {
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: { userId, productId },
      });

      const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity;
      this.validateQuantityAgainstStock(
        { name: product.name, stock: product.stock },
        nextQuantity,
      );

      if (existingCartItem) {
        await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: nextQuantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: { userId, productId, quantity },
        });
      }

      await this.cache.del(`cart:user:${userId}`);

      return this.findAll(userId);
    }

    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: { guestCartToken: guestToken!, productId },
    });

    const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity;
    this.validateQuantityAgainstStock(
      { name: product.name, stock: product.stock },
      nextQuantity,
    );

    if (existingCartItem) {
      await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { productId, quantity, guestCartToken: guestToken! },
      });
    }

    await this.cache.del(`cart:guest:${guestToken}`);

    return this.getGuestCart(guestToken);
  }

  async findAll(userId: number | undefined, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    const cacheKey =
      userId !== undefined ? `cart:user:${userId}` : `cart:guest:${guestToken}`;
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
      const result = await this.prisma.cartItem.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
      });

      await this.cache.setJson(cacheKey, result, 300);
      return result;
    }

    const result = await this.prisma.cartItem.findMany({
      where: {
        guestCartToken: guestToken!,
        createdAt: { gt: this.getGuestCartExpiryThreshold() },
      },
      orderBy: { id: 'desc' },
    });

    await this.cache.setJson(cacheKey, result, 300);
    return result;
  }

  async findOne(userId: number | undefined, id: number, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where:
        userId !== undefined
          ? { userId, id }
          : { id, guestCartToken: guestToken },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return cartItem;
  }

  async update(
    userId: number | undefined,
    id: number,
    quantity: number,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
    }

    const existingCartItem = await this.prisma.cartItem.findFirst({
      where:
        userId !== undefined
          ? { userId, id }
          : { id, guestCartToken: guestToken },
    });

    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity < 1) {
      await this.prisma.cartItem.delete({
        where: { id: existingCartItem.id },
      });

      await this.cache.del(`cart:user:${userId}`);
      await this.cache.del(`cart:guest:${guestToken}`);

      return userId !== undefined
        ? this.findAll(userId)
        : this.getGuestCart(guestToken);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: existingCartItem.productId },
      select: { name: true, stock: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    this.validateQuantityAgainstStock(
      { name: product.name, stock: product.stock },
      quantity,
    );

    await this.prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity },
    });

    await this.cache.del(`cart:user:${userId}`);
    await this.cache.del(`cart:guest:${guestToken}`);

    return userId !== undefined
      ? this.findAll(userId)
      : this.getGuestCart(guestToken);
  }

  async remove(userId: number | undefined, id: number, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
    }

    const existingCartItem = await this.prisma.cartItem.findFirst({
      where:
        userId !== undefined
          ? { userId, id }
          : { id, guestCartToken: guestToken },
    });

    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: existingCartItem.id },
    });

    await this.cache.del(`cart:user:${userId}`);
    await this.cache.del(`cart:guest:${guestToken}`);

    return userId !== undefined
      ? this.findAll(userId)
      : this.getGuestCart(guestToken);
  }

  async clear(userId: number | undefined, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required');
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId);
      await this.prisma.cartItem.deleteMany({
        where: { userId },
      });

      await this.cache.del(`cart:user:${userId}`);

      return [];
    }

    await this.prisma.cartItem.deleteMany({
      where: {
        guestCartToken: guestToken!,
        createdAt: { gt: this.getGuestCartExpiryThreshold() },
      },
    });

    await this.cache.del(`cart:guest:${guestToken}`);

    return [];
  }

  async createGuestCart(items: GuestCartItem[] = [], existingToken?: string) {
    const token = existingToken || this.generateGuestToken();

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const existing = await this.prisma.cartItem.findFirst({
        where: { guestCartToken: token, productId: item.productId },
      });

      const nextQuantity = (existing?.quantity ?? 0) + item.quantity;
      this.validateQuantityAgainstStock(
        { name: product.name, stock: product.stock },
        nextQuantity,
      );

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: nextQuantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            guestCartToken: token,
          },
        });
      }
    }

    return { token, cart: await this.getGuestCart(token) };
  }

  async getGuestCart(token?: string) {
    if (!token) {
      throw new BadRequestException('Guest token required');
    }

    const cacheKey = `cart:guest:${token}`;
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.prisma.cartItem.findMany({
      where: {
        guestCartToken: token,
        createdAt: { gt: this.getGuestCartExpiryThreshold() },
      },
      orderBy: { id: 'desc' },
    });

    await this.cache.setJson(cacheKey, result, 300);
    return result;
  }

  async mergeGuestCart(userId: number, token: string) {
    await this.ensureCustomerAccount(userId);

    const guestItems = await this.prisma.cartItem.findMany({
      where: {
        guestCartToken: token,
        createdAt: { gt: this.getGuestCartExpiryThreshold() },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        const product = await tx.product.findUnique({
          where: { id: guestItem.productId },
        });

        if (!product) {
          continue;
        }

        const existingItem = await tx.cartItem.findFirst({
          where: { userId, productId: guestItem.productId },
        });

        const nextQuantity = (existingItem?.quantity ?? 0) + guestItem.quantity;
        this.validateQuantityAgainstStock(
          { name: product.name, stock: product.stock },
          nextQuantity,
        );

        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: nextQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              userId,
              productId: guestItem.productId,
              quantity: nextQuantity,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          guestCartToken: token,
          createdAt: { gt: this.getGuestCartExpiryThreshold() },
        },
      });
    });

    await this.cache.del(`cart:user:${userId}`);
    await this.cache.del(`cart:guest:${token}`);

    return this.findAll(userId);
  }

  async deleteGuestCart(token: string) {
    if (!token) {
      throw new BadRequestException('Guest token required');
    }

    await this.prisma.cartItem.deleteMany({
      where: {
        guestCartToken: token,
        createdAt: { gt: this.getGuestCartExpiryThreshold() },
      },
    });

    await this.cache.del(`cart:guest:${token}`);
  }
}
