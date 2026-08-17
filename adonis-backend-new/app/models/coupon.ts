import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export default class Coupon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ unique: true })
  declare code: string

  @column()
  declare discountType: DiscountType

  @column()
  declare discountValue: number

  @column()
  declare minOrderValue: number | null

  @column()
  declare maxDiscount: number | null

  @column()
  declare usageLimit: number | null

  @column()
  declare usedCount: number

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare validFrom: DateTime

  @column.dateTime()
  declare validUntil: DateTime

  @column()
  declare perUserLimit: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
