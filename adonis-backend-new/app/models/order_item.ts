import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Order from '#models/order'
import Product from '#models/product'

export default class OrderItem extends BaseModel {
  static table = 'order_items'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare price: number

  @belongsTo(() => Order)
  declare order: Order

  @belongsTo(() => Product)
  declare product: Product
}
