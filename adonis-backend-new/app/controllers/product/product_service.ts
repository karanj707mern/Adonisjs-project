import { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import StorageService from '#services/storage_service';
import {  ConflictException, NotFoundException  } from '#exceptions/http_exceptions';

export default class ProductService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
    private storage: StorageService,
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return (error as { code: string }).code === 'P2002';
  }

  private normalizeTags(tags?: string[]) {
    return Array.from(
      new Set(
        (tags || [])
          .map((tag) => (tag as string).trim())
          .filter(Boolean)
          .map((tag) => (tag as string).toLowerCase()),
      ),
    );
  }

  private normalizeCreateProductPayload(data: Record<string, unknown>) {
    return {
      name: (data.name as string).trim(),
      slug: (data.slug as string).trim().toLowerCase(),
      sku: (data.sku as string).trim().toUpperCase(),
      description: (data.description as string).trim(),
      image: (data.image as string).trim(),
      price: data.price as number,
      stock: data.stock as number,
      brand:
        data.brand !== undefined ? String(data.brand).trim() || null : null,
      tags: data.tags ? this.normalizeTags(data.tags as string[]) : undefined,
      seoTitle:
        data.seoTitle !== undefined
          ? String(data.seoTitle).trim() || null
          : null,
      seoDescription:
        data.seoDescription !== undefined
          ? String(data.seoDescription).trim() || null
          : null,
      weightGrams: data.weightGrams ?? null,
      compareAtPrice: data.compareAtPrice ?? null,
      isActive: data.isActive ?? true,
      isNewArrival: data.isNewArrival ?? false,
    };
  }

  private normalizeUpdateProductPayload(data: Record<string, unknown>) {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = String(data.name).trim();
    if (data.slug !== undefined)
      payload.slug = String(data.slug).trim().toLowerCase();
    if (data.sku !== undefined)
      payload.sku = String(data.sku).trim().toUpperCase();
    if (data.description !== undefined)
      payload.description = String(data.description).trim();
    if (data.image !== undefined) payload.image = String(data.image).trim();
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.brand !== undefined)
      payload.brand = String(data.brand).trim() || null;
    if (data.tags) payload.tags = this.normalizeTags(data.tags as string[]);
    if (data.seoTitle !== undefined)
      payload.seoTitle = String(data.seoTitle).trim() || null;
    if (data.seoDescription !== undefined)
      payload.seoDescription = String(data.seoDescription).trim() || null;
    if (data.weightGrams !== undefined) payload.weightGrams = data.weightGrams;
    if (data.compareAtPrice !== undefined)
      payload.compareAtPrice = data.compareAtPrice;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.isNewArrival !== undefined)
      payload.isNewArrival = data.isNewArrival;
    return payload;
  }

  async uploadProductImage(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<{ url: string }> {
    const result = await this.storage.uploadFile(file, 'products', 'product');
    return { url: result.url };
  }

  async createProduct(data: Record<string, unknown>) {
    try {
      const product = await this.prisma.product.create({
        data: this.normalizeCreateProductPayload(data) as any,
      });
      await this.invalidateProductCaches(product.id);
      return product;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Product slug or SKU already exists.');
      }
      throw error;
    }
  }

  async getProducts(includeInactive = false, skip = 0, take = 50) {
    const cappedTake = Math.min(take, 50);
    const cacheKey = includeInactive
      ? `products:all:${skip}:${cappedTake}`
      : `products:active:${skip}:${cappedTake}`;
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: cappedTake,
    });

    await this.cache.setJson(cacheKey, products, 300);
    return products;
  }

  async getNewArrivals(limit = 8) {
    const cacheKey = `products:new-arrivals:${limit}`;
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    await this.cache.setJson(cacheKey, products, 300);
    return products;
  }

  async getProductById(id: number, includeInactive = false) {
    const cacheKey = `product:${id}${includeInactive ? ':all' : ''}`;
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { isActive: true }),
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.cache.setJson(cacheKey, product, 300);
    return product;
  }

  async updateProduct(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: this.normalizeUpdateProductPayload(data) as any,
      });
      await this.invalidateProductCaches(id);
      return product;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Product slug or SKU already exists.');
      }
      throw error;
    }
  }

  async deleteProduct(id: number) {
    await this.prisma.product.deleteMany({ where: { id } });
    await this.invalidateProductCaches(id);
  }

  private async invalidateProductCaches(productId?: number) {
    const keys = ['products:active', 'products:all', 'products:new-arrivals:8'];

    if (productId) {
      keys.push(`product:${productId}`);
      keys.push(`product:${productId}:all`);
    }

    await Promise.all(keys.map((key) => this.cache.del(key)));
  }
}
