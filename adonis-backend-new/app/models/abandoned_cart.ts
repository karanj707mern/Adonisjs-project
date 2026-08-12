import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AbandonedCart extends BaseModel {
  static table = 'abandoned_cart'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ nullable: true })
  declare userId: number | null

  @column({ columnName: 'guest_token', nullable: true })
  declare guestToken: string | null

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column({ defaultValue: false })
  declare recovered: boolean

  @column({ columnName: 'recovered_at', nullable: true })
  declare recoveredAt: Date | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime
}
