import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'
import {
  ConflictException,
  NotFoundException,
} from '@adonisjs/core/http'

@injectable()
export default class ProductService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
    private storage: StorageService,
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.name === 'DatabaseQueryException' ||
        (error as any).code === '23505')
    )
  }

  private normalizeTags(tags?: string[]) {
    return Array.from(
      new Set(
        (tags || [])
          .map((tag) => (tag as string).trim())
          .filter(Boolean)
          .map((tag) => (tag as string).toLowerCase()),
      ),
    )
  }

  private normalizeCreateProductPayload(data: Record<string, unknown>) {
    return {
      ...data,
      name: (data.name as string).trim(),
      slug: (data.slug as string).trim().toLowerCase(),
      sku: (data.sku as string).trim().toUpperCase(),
      description: (data.description as string).trim(),
      image: (data.image as string).trim(),
      brand:
        data.brand !== undefined ? String(data.brand).trim() || null : null,
      tags: data.tags ? this.normalizeTags(data.tags as string[]) : undefined,
      seo_title:
        data.seoTitle !== undefined
          ? String(data.seoTitle).trim() || null
          : null,
      seo_description:
        data.seoDescription !== undefined
          ? String(data.seoDescription).trim() || null
          : null,
      weight_grams: data.weightGrams ?? null,
      compare_at_price: data.compareAtPrice ?? null,
      is_active: data.isActive ?? true,
      is_new_arrival: data.isNewArrival ?? false,
    }
  }

  private normalizeUpdateProductPayload(data: Record<string, unknown>) {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = String(data.name).trim()
    if (data.slug !== undefined)
      payload.slug = String(data.slug).trim().toLowerCase()
    if (data.sku !== undefined)
      payload.sku = String(data.sku).trim().toUpperCase()
    if (data.description !== undefined)
      payload.description = String(data.description).trim()
    if (data.image !== undefined) payload.image = String(data.image).trim()
    if (data.brand !== undefined)
      payload.brand = String(data.brand).trim() || null
    if (data.tags) payload.tags = this.normalizeTags(data.tags as string[])
    if (data.seoTitle !== undefined)
      payload.seo_title = String(data.seoTitle).trim() || null
    if (data.seoDescription !== undefined)
      payload.seo_description = String(data.seoDescription).trim() || null
    if (data.weightGrams !== undefined) payload.weight_grams = data.weightGrams
    if (data.compareAtPrice !== undefined)
      payload.compare_at_price = data.compareAtPrice
    if (data.isActive !== undefined) payload.is_active = data.isActive
    if (data.isNewArrival !== undefined)
      payload.is_new_arrival = data.isNewArrival
    return payload
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
      const product = await this.db.table('products').insert(
        this.normalizeCreateProductPayload(data),
      )
      const [row] = await this.db
        .table('products')
        .where('id', product[0])
        .first()
      await this.invalidateProductCaches(product[0])
      return row
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Product slug or SKU already exists.')
      }
      throw error
    }
  }

  async getProducts(includeInactive = false, skip = 0, take = 50) {
    const cappedTake = Math.min(take, 50)
    const cacheKey = includeInactive
      ? `products:all:${skip}:${cappedTake}`
      : `products:active:${skip}:${cappedTake}`
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    const query = this.db.table('products').orderBy('is_active', 'desc').orderBy('created_at', 'desc').offset(skip).limit(cappedTake)
    if (!includeInactive) {
      query.where('is_active', true)
    }
    const products = await query

    await this.cache.setJson(cacheKey, products, 300)
    return products
  }

  async getNewArrivals(limit = 8) {
    const cacheKey = `products:new-arrivals:${limit}`
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    const products = await this.db
      .table('products')
      .where('is_active', true)
      .where('is_new_arrival', true)
      .orderBy('created_at', 'desc')
      .limit(limit)

    await this.cache.setJson(cacheKey, products, 300)
    return products
  }

  async getProductById(id: number, includeInactive = false) {
    const cacheKey = `product:${id}${includeInactive ? ':all' : ''}`
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey)
    if (cached) {
      return cached
    }

    const query = this.db.table('products').where('id', id)
    if (!includeInactive) {
      query.andWhere('is_active', true)
    }
    const product = await query.first()

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    await this.cache.setJson(cacheKey, product, 300)
    return product
  }

  async updateProduct(id: number, data: Record<string, unknown>) {
    const existing = await this.db
      .table('products')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException('Product not found')
    }

    try {
      await this.db.table('products').where('id', id).update(
        this.normalizeUpdateProductPayload(data),
      )
      const [product] = await this.db
        .table('products')
        .where('id', id)
        .first()
      await this.invalidateProductCaches(id)
      return product
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Product slug or SKU already exists.')
      }
      throw error
    }
  }

  async deleteProduct(id: number) {
    const product = await this.db.table('products').where('id', id).delete()
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
