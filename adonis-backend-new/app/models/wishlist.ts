import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Wishlist extends BaseModel {
  static table = 'wishlists'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ nullable: true })
  declare userId: number | null

  @column()
  declare productId: number

  @column({ columnName: 'guest_wishlist_token', nullable: true })
  declare guestWishlistToken: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
