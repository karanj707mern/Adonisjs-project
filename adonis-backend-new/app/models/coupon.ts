import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Coupon extends BaseModel {
  static table = 'coupons'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ unique: true })
  declare code: string

  @column({ columnName: 'discount_type' })
  declare discountType: 'PERCENTAGE' | 'FIXED'

  @column({ columnName: 'discount_value' })
  declare discountValue: number

  @column({ columnName: 'min_order_value', nullable: true })
  declare minOrderValue: number | null

  @column({ columnName: 'max_discount', nullable: true })
  declare maxDiscount: number | null

  @column({ columnName: 'usage_limit', nullable: true })
  declare usageLimit: number | null

  @column({ columnName: 'used_count', defaultValue: 0 })
  declare usedCount: number

  @column({ defaultValue: true })
  declare isActive: boolean

  @column.dateTime({ columnName: 'valid_from' })
  declare validFrom: DateTime

  @column.dateTime({ columnName: 'valid_until' })
  declare validUntil: DateTime

  @column({ columnName: 'per_user_limit', nullable: true })
  declare perUserLimit: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
