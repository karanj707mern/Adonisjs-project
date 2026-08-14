import { inject } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'
export default class ProductService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject() private cache: RedisCacheService,
    @inject() private storage: StorageService
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }

  private normalizeTags(tags?: string[]) {
    return Array.from(
      new Set(
        (tags || [])
          .map((tag) => tag as string)
          .filter(Boolean)
          .map((tag) => (tag as string).toLowerCase())
      )
    )
  }

  private normalizeCreateProductPayload(data: Record<string, unknown>) {
    return {
      ...data,
      name: data.name as string,
      slug: (data.slug as string).toLowerCase(),
      sku: (data.sku as string).toUpperCase(),
      description: data.description as string,
      image: data.image as string,
      brand: data.brand !== undefined ? String(data.brand) || null : null,
      tags: data.tags ? this.normalizeTags(data.tags as string[]) : undefined,
      seoTitle: data.seoTitle !== undefined ? String(data.seoTitle) || null : null,
      seoDescription:
        data.seoDescription !== undefined ? String(data.seoDescription) || null : null,
      weightGrams: data.weightGrams ?? null,
      compareAtPrice: data.compareAtPrice ?? null,
      isActive: data.isActive ?? true,
      isNewArrival: data.isNewArrival ?? false,
    }
  }

  private normalizeUpdateProductPayload(data: Record<string, unknown>) {
    return {
      ...data,
      name: data.name !== undefined ? String(data.name) : undefined,
      slug: data.slug !== undefined ? String(data.slug).toLowerCase() : undefined,
      sku: data.sku !== undefined ? String(data.sku).toUpperCase() : undefined,
      description: data.description !== undefined ? String(data.description) : undefined,
      image: data.image !== undefined ? String(data.image) : undefined,
      brand: data.brand === undefined ? undefined : String(data.brand) || null,
      tags: data.tags ? this.normalizeTags(data.tags as string[]) : undefined,
      seoTitle: data.seoTitle === undefined ? undefined : String(data.seoTitle) || null,
      seoDescription:
        data.seoDescription === undefined ? undefined : String(data.seoDescription) || null,
      weightGrams: data.weightGrams ?? undefined,
      compareAtPrice: data.compareAtPrice ?? undefined,
      isActive: data.isActive ?? undefined,
      isNewArrival: data.isNewArrival ?? undefined,
    }
  }

  async uploadProductImage(file: {
    buffer: Buffer
    mimetype: string
    originalname: string
  }): Promise<{ url: string }> {
    const result = await this.storage.uploadFile(file, 'products', 'product')
    return { url: result.url }
  }

  async createProduct(data: Record<string, unknown>) {
    try {
      const product = await this.prisma.product.create({
        data: this.normalizeCreateProductPayload(data) as any,
      })
      await this.invalidateProductCaches(product.id)
      return product
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw { status: 409, message: 'Product slug or SKU already exists.' }
      }
      throw error
    }
  }

  async getProducts(includeInactive = false, skip = 0, take = 50) {
    const cappedTake = Math.min(take, 50)
    const cacheKey = includeInactive
      ? `products:all:${skip}:${cappedTake}`
      : `products:active:${skip}:${cappedTake}`
    const cached = await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    const products = await this.prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: cappedTake,
    })

    await this.cache.setJson(cacheKey, products, 300)
    return products
  }

  async getNewArrivals(limit = 8) {
    const cacheKey = `products:new-arrivals:${limit}`
    const cached = await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    const products = await this.prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    await this.cache.setJson(cacheKey, products, 300)
    return products
  }

  async getProductById(id: number, includeInactive = false) {
    const cacheKey = `product:${id}${includeInactive ? ':all' : ''}`
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey)
    if (cached) {
      return cached
    }

    const product = await this.prisma.product.findUnique({
      where: {
        id,
        ...(includeInactive ? {} : { isActive: true }),
      },
    })

    if (!product) {
      throw { status: 404, message: 'Product not found' }
    }

    await this.cache.setJson(cacheKey, product, 300)
    return product
  }

  async updateProduct(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw { status: 404, message: 'Product not found' }
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: this.normalizeUpdateProductPayload(data) as any,
      })
      await this.invalidateProductCaches(id)
      return product
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw { status: 409, message: 'Product slug or SKU already exists.' }
      }
      throw error
    }
  }

  async deleteProduct(id: number) {
    const product = await this.prisma.product.delete({
      where: { id },
    })
    await this.invalidateProductCaches(id)
    return product
  }

  private async invalidateProductCaches(productId?: number) {
    const keys = ['products:active', 'products:all', 'products:new-arrivals:8']

    if (productId) {
      keys.push(`product:${productId}`)
      keys.push(`product:${productId}:all`)
    }

    await Promise.all(keys.map((key) => this.cache.del(key)))
  }
}
