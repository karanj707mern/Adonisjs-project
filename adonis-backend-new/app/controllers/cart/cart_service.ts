import { inject, injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import { RedisCacheService } from '#services/redis_cache_service'
import crypto from 'node:crypto'

interface GuestCartItem {
  productId: number
  quantity: number
}

@injectable()
export default class CartService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
  ) {}

  private generateGuestToken(): string {
    return crypto.randomUUID()
  }

  private getGuestCartExpiryThreshold(): Date {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  }

  private validateQuantityAgainstStock(
    product: { name: string; stock: number },
    quantity: number,
  ) {
    if (product.stock <= 0) {
      throw new BadRequestException(
        `${product.name} is currently out of stock.`,
      )
    }
    if (quantity > product.stock) {
      throw new BadRequestException(
        `${product.name} has only ${product.stock} item(s) available right now.`,
      )
    }
  }

  private async ensureCustomerAccount(userId: number) {
    const user = await this.db
      .table('users')
      .where('id', userId)
      .select('role')
      .first()

    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Admin accounts cannot use the cart.')
    }
  }

  async create(
    userId: number | undefined,
    productId: number,
    quantity = 1,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1')
    }

    const product = await this.db
      .table('products')
      .where('id', productId)
      .first()

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    if (userId !== undefined) {
      const existingCartItem = await this.db
        .table('cart_items')
        .where('user_id', userId)
        .andWhere('product_id', productId)
        .first()

      const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity
      this.validateQuantityAgainstStock(product, nextQuantity)

      if (existingCartItem) {
        await this.db
          .table('cart_items')
          .where('id', existingCartItem.id)
          .update({ quantity: nextQuantity })
      } else {
        await this.db.table('cart_items').insert({
          user_id: userId,
          product_id: productId,
          quantity,
        })
      }

      await this.cache.del(`cart:user:${userId}`)

      return this.findAll(userId)
    }

    const existingCartItem = await this.db
      .table('cart_items')
      .where('guest_cart_token', guestToken!)
      .andWhere('product_id', productId)
      .first()

    const nextQuantity = (existingCartItem?.quantity ?? 0) + quantity
    this.validateQuantityAgainstStock(product, nextQuantity)

    if (existingCartItem) {
      await this.db
        .table('cart_items')
        .where('id', existingCartItem.id)
        .update({ quantity: nextQuantity })
    } else {
      await this.db.table('cart_items').insert({
        product_id: productId,
        quantity,
        guest_cart_token: guestToken!,
      })
    }

    await this.cache.del(`cart:guest:${guestToken}`)

    return this.getGuestCart(guestToken)
  }

  async findAll(userId: number | undefined, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    const cacheKey =
      userId !== undefined ? `cart:user:${userId}` : `cart:guest:${guestToken}`
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
      const result = await this.db
        .table('cart_items')
        .where('user_id', userId)
        .orderBy('id', 'desc')

      await this.cache.setJson(cacheKey, result, 300)
      return result
    }

    const result = await this.db
      .table('cart_items')
      .where('guest_cart_token', guestToken!)
      .where('created_at', '>', this.getGuestCartExpiryThreshold())
      .orderBy('id', 'desc')

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async findOne(userId: number | undefined, id: number, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
    }

    const whereClause =
      userId !== undefined
        ? { user_id: userId, id }
        : { id, guest_cart_token: guestToken }

    const cartItem = await this.db.table('cart_items').where(whereClause).first()

    if (!cartItem) {
      throw new NotFoundException('Cart item not found')
    }

    return cartItem
  }

  async update(
    userId: number | undefined,
    id: number,
    quantity: number,
    guestToken?: string,
  ) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
    }

    const whereClause =
      userId !== undefined
        ? { user_id: userId, id }
        : { id, guest_cart_token: guestToken }

    const existingCartItem = await this.db
      .table('cart_items')
      .where(whereClause)
      .first()

    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found')
    }

    if (quantity < 1) {
      await this.db.table('cart_items').where('id', existingCartItem.id).delete()

      await this.cache.del(`cart:user:${userId}`)
      await this.cache.del(`cart:guest:${guestToken}`)

      return userId !== undefined
        ? this.findAll(userId)
        : this.getGuestCart(guestToken)
    }

    const product = await this.db
      .table('products')
      .where('id', existingCartItem.product_id)
      .select('name', 'stock')
      .first()

    if (!product) {
      throw new NotFoundException('Product not found')
    }
    this.validateQuantityAgainstStock(product, quantity)

    await this.db
      .table('cart_items')
      .where('id', existingCartItem.id)
      .update({ quantity })

    await this.cache.del(`cart:user:${userId}`)
    await this.cache.del(`cart:guest:${guestToken}`)

    return userId !== undefined
      ? this.findAll(userId)
      : this.getGuestCart(guestToken)
  }

  async remove(userId: number | undefined, id: number, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
    }

    const whereClause =
      userId !== undefined
        ? { user_id: userId, id }
        : { id, guest_cart_token: guestToken }

    const existingCartItem = await this.db
      .table('cart_items')
      .where(whereClause)
      .first()

    if (!existingCartItem) {
      throw new NotFoundException('Cart item not found')
    }

    await this.db.table('cart_items').where('id', existingCartItem.id).delete()

    await this.cache.del(`cart:user:${userId}`)
    await this.cache.del(`cart:guest:${guestToken}`)

    return userId !== undefined
      ? this.findAll(userId)
      : this.getGuestCart(guestToken)
  }

  async clear(userId: number | undefined, guestToken?: string) {
    if (userId === undefined && !guestToken) {
      throw new BadRequestException('Guest token required')
    }

    if (userId !== undefined) {
      await this.ensureCustomerAccount(userId)
      await this.db.table('cart_items').where('user_id', userId).delete()

      await this.cache.del(`cart:user:${userId}`)

      return []
    }

    await this.db
      .table('cart_items')
      .where('guest_cart_token', guestToken!)
      .where('created_at', '>', this.getGuestCartExpiryThreshold())
      .delete()

    await this.cache.del(`cart:guest:${guestToken}`)

    return []
  }

  async createGuestCart(items: GuestCartItem[] = [], existingToken?: string) {
    const token = existingToken || this.generateGuestToken()

    for (const item of items) {
      const product = await this.db
        .table('products')
        .where('id', item.productId)
        .first()

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`)
      }

      const existing = await this.db
        .table('cart_items')
        .where('guest_cart_token', token)
        .andWhere('product_id', item.productId)
        .first()

      const nextQuantity = (existing?.quantity ?? 0) + item.quantity
      this.validateQuantityAgainstStock(product, nextQuantity)

      if (existing) {
        await this.db
          .table('cart_items')
          .where('id', existing.id)
          .update({ quantity: nextQuantity })
      } else {
        await this.db.table('cart_items').insert({
          product_id: item.productId,
          quantity: item.quantity,
          guest_cart_token: token,
        })
      }
    }

    return { token, cart: await this.getGuestCart(token) }
  }

  async getGuestCart(token?: string) {
    if (!token) {
      throw new BadRequestException('Guest token required')
    }

    const cacheKey = `cart:guest:${token}`
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await this.db
      .table('cart_items')
      .where('guest_cart_token', token)
      .where('created_at', '>', this.getGuestCartExpiryThreshold())
      .orderBy('id', 'desc')

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async mergeGuestCart(userId: number, token: string) {
    await this.ensureCustomerAccount(userId)

    const guestItems = await this.db
      .table('cart_items')
      .where('guest_cart_token', token)
      .where('created_at', '>', this.getGuestCartExpiryThreshold())

    await this.db.transaction(async (trx) => {
      for (const guestItem of guestItems) {
        const product = await trx
          .table('products')
          .where('id', guestItem.product_id)
          .first()

        if (!product) {
          continue
        }

        const existingItem = await trx
          .table('cart_items')
          .where('user_id', userId)
          .andWhere('product_id', guestItem.product_id)
          .first()

        const nextQuantity = (existingItem?.quantity ?? 0) + guestItem.quantity
        this.validateQuantityAgainstStock(product, nextQuantity)

        if (existingItem) {
          await trx
            .table('cart_items')
            .where('id', existingItem.id)
            .update({ quantity: nextQuantity })
        } else {
          await trx.table('cart_items').insert({
            user_id: userId,
            product_id: guestItem.product_id,
            quantity: nextQuantity,
          })
        }
      }

      await trx
        .table('cart_items')
        .where('guest_cart_token', token)
        .where('created_at', '>', this.getGuestCartExpiryThreshold())
        .delete()
    })

    await this.cache.del(`cart:user:${userId}`)
    await this.cache.del(`cart:guest:${token}`)

    return this.findAll(userId)
  }

  async deleteGuestCart(token: string) {
    if (!token) {
      throw new BadRequestException('Guest token required')
    }

    await this.db
      .table('cart_items')
      .where('guest_cart_token', token)
      .where('created_at', '>', this.getGuestCartExpiryThreshold())
      .delete()

    await this.cache.del(`cart:guest:${token}`)
  }
}
