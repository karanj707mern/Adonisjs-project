import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class GiftCard extends BaseModel {
  static table = 'gift_cards'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ unique: true })
  declare code: string

  @column({ columnName: 'initial_amount' })
  declare initialAmount: number

  @column({ columnName: 'remaining_amount' })
  declare remainingAmount: number

  @column({ defaultValue: 'INR' })
  declare currency: string

  @column({ defaultValue: true })
  declare isActive: boolean

  @column({ columnName: 'redeemed_by', nullable: true })
  declare redeemedBy: number | null

  @column({ columnName: 'redeemed_at', nullable: true })
  declare redeemedAt: Date | null

  @column({ columnName: 'expires_at', nullable: true })
  declare expiresAt: Date | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'last_used_at', nullable: true })
  declare lastUsedAt: Date | null
}
