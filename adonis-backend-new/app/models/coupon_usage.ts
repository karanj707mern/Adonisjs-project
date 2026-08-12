import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class CouponUsage extends BaseModel {
  static table = 'coupon_usages'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare couponId: number

  @column()
  declare userId: number

  @column()
  declare orderId: number

  @column.dateTime()
  declare usedAt: DateTime
}
