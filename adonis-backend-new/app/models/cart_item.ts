import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import Product from '#models/product'

export default class CartItem extends BaseModel {
  static table = 'cart_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare guestCartToken: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: User

  @belongsTo(() => Product)
  declare product: Product
}
