import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class CartItem extends BaseModel {
  static table = 'cart_items'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column({ columnName: 'guest_cart_token', nullable: true })
  declare guestCartToken: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
