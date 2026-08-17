import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'

@injectable()
export default class WishlistService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
  ) {}

  private generateGuestToken(): string {
    throw new Error('Guest token generation not supported via Database')
  }

  private getGuestWishlistExpiryThreshold(): Date {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  }

  async mergeGuestWishlist(userId: number, token: string) {
    if (!token) {
      throw new BadRequestException('Guest wishlist token is required')
    }

    const guestItems = await this.db
      .table('wishlists')
      .where('guest_wishlist_token', token)
      .where('created_at', '>', this.getGuestWishlistExpiryThreshold())
      .select('product_id')

    if (guestItems.length === 0) {
      return { message: 'No guest wishlist items to merge' }
    }

    await this.db.transaction(async (trx) => {
      for (const item of guestItems) {
        const existing = await trx
          .table('wishlists')
          .where('user_id', userId)
          .andWhere('product_id', item.product_id)
          .first()

        if (existing) {
          await trx.table('wishlists').where('id', existing.id).update({})
        } else {
          await trx.table('wishlists').insert({
            user_id: userId,
            product_id: item.product_id,
          })
        }
      }

      await trx
        .table('wishlists')
        .where('guest_wishlist_token', token)
        .where('created_at', '>', this.getGuestWishlistExpiryThreshold())
        .delete()
    })

    await this.cache.del(`wishlist:user:${userId}`)
    await this.cache.del(`wishlist:guest:${token}`)

    return this.findAll(userId)
  }

  async findAll(userId: number) {
    const cacheKey = `wishlist:user:${userId}`
    const cached =
      await this.cache.getJson<{ product_id: number; created_at: string }[]>(
        cacheKey,
      )
    if (cached) return cached

    const items = await this.db
      .table('wishlists')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .select('product_id', 'created_at')

    await this.cache.setJson(cacheKey, items, 300)
    return items
  }

  async findOne(userId: number, productId: number) {
    const item = await this.db
      .table('wishlists')
      .where('user_id', userId)
      .andWhere('product_id', productId)
      .first()

    if (!item) {
      throw new NotFoundException('Wishlist item not found')
    }

    return item
  }

  async add(userId: number, productId: number) {
    const product = await this.db
      .table('products')
      .where('id', productId)
      .first()

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    const existing = await this.db
      .table('wishlists')
      .where('user_id', userId)
      .andWhere('product_id', productId)
      .first()

    if (existing) {
      return existing
    }

    await this.db.table('wishlists').insert({
      user_id: userId,
      product_id: productId,
    })

    await this.cache.del(`wishlist:user:${userId}`)

    return this.findOne(userId, productId)
  }

  async remove(userId: number, productId: number) {
    const item = await this.db
      .table('wishlists')
      .where('user_id', userId)
      .andWhere('product_id', productId)
      .first()

    if (!item) {
      throw new NotFoundException('Wishlist item not found')
    }

    await this.db.table('wishlists').where('id', item.id).delete()

    await this.cache.del(`wishlist:user:${userId}`)

    return { message: 'Wishlist item removed' }
  }

  async clear(userId: number) {
    await this.db.table('wishlists').where('user_id', userId).delete()

    await this.cache.del(`wishlist:user:${userId}`)

    return []
  }
}
