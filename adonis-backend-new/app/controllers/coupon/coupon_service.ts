import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import { createCouponValidator } from './coupon_validators'

@injectable()
export default class CouponService {
  constructor(private db: Database) {}

  async validate(code: string, orderValue: number) {
    const upperCode = code.toUpperCase()
    const now = new Date()

    const coupon = await this.db
      .table('coupons')
      .where('code', upperCode)
      .where('is_active', true)
      .where('valid_from', '<=', now)
      .where('valid_until', '>=', now)
      .first()

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code.')
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestException('This coupon has reached its usage limit.')
    }

    if (coupon.min_order_value && orderValue < coupon.min_order_value) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.min_order_value} required for this coupon.`,
      )
    }

    let discountAmount: number

    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (orderValue * coupon.discount_value) / 100
      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount)
      }
    } else {
      discountAmount = coupon.discount_value
    }

    return {
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      finalAmount: Math.max(0, orderValue - discountAmount),
    }
  }

  async validateForUser(code: string, orderValue: number, userId: number) {
    const upperCode = code.toUpperCase()
    const now = new Date()

    const coupon = await this.db
      .table('coupons')
      .where('code', upperCode)
      .where('is_active', true)
      .where('valid_from', '<=', now)
      .where('valid_until', '>=', now)
      .first()

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code.')
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new BadRequestException('This coupon has reached its usage limit.')
    }

    if (
      userId > 0 &&
      coupon.per_user_limit !== null &&
      coupon.per_user_limit !== undefined
    ) {
      const userUsageCount = await this.db
        .table('coupon_usages')
        .where('coupon_id', coupon.id)
        .andWhere('user_id', userId)
        .count('id as total')

      if ((userUsageCount[0] as any).total >= coupon.per_user_limit) {
        throw new BadRequestException(
          'You have reached the maximum number of times this coupon can be used.',
        )
      }
    }

    if (coupon.min_order_value && orderValue < coupon.min_order_value) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.min_order_value} required for this coupon.`,
      )
    }

    let discountAmount: number

    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (orderValue * coupon.discount_value) / 100
      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount)
      }
    } else {
      discountAmount = coupon.discount_value
    }

    return {
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      finalAmount: Math.max(0, orderValue - discountAmount),
    }
  }

  async recordUsage(couponId: number, userId: number, orderId: number) {
    await this.db.transaction(async (trx) => {
      const coupon = await trx
        .table('coupons')
        .where('id', couponId)
        .select('id', 'usage_limit', 'used_count')
        .first()

      if (!coupon) {
        throw new BadRequestException('Coupon not found.')
      }

      if (
        coupon.usage_limit !== null &&
        coupon.used_count >= coupon.usage_limit
      ) {
        throw new BadRequestException(
          'This coupon has reached its usage limit.',
        )
      }

      await trx.table('coupon_usages').insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
      })

      await trx
        .table('coupons')
        .where('id', couponId)
        .update({ used_count: trx.raw('?? + 1', ['used_count']) })
    })
  }

  async getCouponAnalytics() {
    const coupons = await this.db.table('coupons').orderBy('created_at', 'desc')

    return coupons.map((coupon: any) => {
      return {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        usedCount: coupon.used_count,
        usageLimit: coupon.usage_limit,
        perUserLimit: coupon.per_user_limit,
        isActive: coupon.is_active,
        validFrom: coupon.valid_from,
        validUntil: coupon.valid_until,
        totalUsages: 0,
        totalDiscountGiven:
          coupon.discount_type === 'FIXED'
            ? (coupon.used_count || 0) * coupon.discount_value
            : 0,
      }
    })
  }

  async create(data: Record<string, unknown>) {
    const insertId = await this.db.table('coupons').insert({
      code: (data.code as string).trim().toUpperCase(),
      discount_type: data.discountType as string,
      discount_value: data.discountValue as number,
      min_order_value:
        (data.minOrderValue as number | null | undefined) ?? null,
      max_discount: (data.maxDiscount as number | null | undefined) ?? null,
      per_user_limit:
        (data.perUserLimit as number | null | undefined) ?? null,
      usage_limit: (data.usageLimit as number | null | undefined) ?? null,
      valid_from: new Date(data.validFrom as string | Date),
      valid_until: new Date(data.validUntil as string | Date),
    })

    const [result] = await this.db
      .table('coupons')
      .where('id', insertId[0])
      .first()

    return result
  }

  async findAll() {
    return this.db.table('coupons').orderBy('created_at', 'desc')
  }

  async update(id: number, data: Record<string, unknown>) {
    await this.db.table('coupons').where('id', id).update({
      code: (data.code as string).trim().toUpperCase(),
      discount_type: data.discountType as string,
      discount_value: data.discountValue as number,
      min_order_value:
        (data.minOrderValue as number | null | undefined) ?? null,
      max_discount: (data.maxDiscount as number | null | undefined) ?? null,
      per_user_limit:
        (data.perUserLimit as number | null | undefined) ?? null,
      usage_limit: (data.usageLimit as number | null | undefined) ?? null,
      valid_from: new Date(data.validFrom as string | Date),
      valid_until: new Date(data.validUntil as string | Date),
    })

    const [result] = await this.db
      .table('coupons')
      .where('id', id)
      .first()

    return result
  }

  async remove(id: number) {
    const existing = await this.db
      .table('coupons')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException('Coupon not found')
    }

    await this.db.table('coupons').where('id', id).delete()

    return { message: 'Coupon removed' }
  }
}
