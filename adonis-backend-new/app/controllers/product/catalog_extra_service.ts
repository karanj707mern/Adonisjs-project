import RedisCacheService from '#services/redis_cache_service'
import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'

@injectable()
export default class CatalogExtraService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
  ) {}

  private sanitizeHtml(text: string | null): string | null {
    if (!text) return text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  async addView(userId: number, productId: number) {
    await this.db.table('recently_viewed').insert({
      user_id: userId,
      product_id: productId,
    })

    await this.cache.del(`recently-viewed:user:${userId}`)

    const count = await this.db
      .table('recently_viewed')
      .where('user_id', userId)
      .count('id as total')

    const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    if (count[0].total > 50) {
      const oldest = await this.db
        .table('recently_viewed')
        .where('user_id', userId)
        .orderBy('viewed_at', 'asc')
        .limit(Math.max(0, (count[0].total as number) - 50))

      const ids = oldest.map((r: any) => r.id)
      if (ids.length > 0) {
        await this.db.table('recently_viewed').whereIn('id', ids).delete()
      }
    }

    const entries = await this.db
      .table('recently_viewed')
      .where('user_id', userId)
      .orderBy('viewed_at', 'desc')
      .limit(50)

    await this.cache.setJson(`recently-viewed:user:${userId}`, entries, 300)
    return entries
  }

  async getRecentlyViewed(userId: number) {
    const cacheKey = `recently-viewed:user:${userId}`
    const cached = await this.cache.getJson<
      { product_id: number; viewed_at: string }[]
    >(cacheKey)
    if (cached) return cached

    const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const entries = await this.db
      .table('recently_viewed')
      .where('user_id', userId)
      .where('viewed_at', '>', threshold)
      .orderBy('viewed_at', 'desc')
      .limit(50)

    await this.cache.setJson(cacheKey, entries, 300)
    return entries
  }

  async clearRecentlyViewed(userId: number) {
    await this.db.table('recently_viewed').where('user_id', userId).delete()
    await this.cache.del(`recently-viewed:user:${userId}`)
  }

  async addAbandonedCart(userId: number | null, productId: number, quantity = 1, guestToken?: string) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await this.db.table('abandoned_carts').insert({
      user_id: userId,
      guest_token: guestToken || null,
      product_id: productId,
      quantity,
      recovered: false,
      expires_at: expiresAt,
    })

    const entries = await this.db
      .table('abandoned_carts')
      .where(
        (qb) =>
          qb.where('user_id', userId).orWhere('guest_token', guestToken),
      )
      .where('expires_at', '>', new Date())

    await this.cache.setJson(`abandoned-cart:${userId || guestToken}`, entries, 300)
    return entries
  }

  async getAbandonedCarts(userId: number | null, guestToken?: string) {
    const cacheKey = `abandoned-cart:${userId || guestToken}`
    const cached = await this.cache.getJson<
      { user_id: number | null; product_id: number; quantity: number }[]
    >(cacheKey)
    if (cached) return cached

    const entries = await this.db
      .table('abandoned_carts')
      .where(
        (qb) =>
          qb.where('user_id', userId).orWhere('guest_token', guestToken),
      )
      .where('expires_at', '>', new Date())

    await this.cache.setJson(cacheKey, entries, 300)
    return entries
  }

  async markCartRecovered(userId: number | null, guestToken?: string) {
    await this.db
      .table('abandoned_carts')
      .where(
        (qb) =>
          qb.where('user_id', userId).orWhere('guest_token', guestToken),
      )
      .where('recovered', false)
      .update({
        recovered: true,
        recovered_at: new Date(),
      })

    await this.cache.del(`abandoned-cart:${userId || guestToken}`)
  }
}
