import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import Product from '#models/product';

export default class OrderItem extends BaseModel {
  static table = 'order_items';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare orderId: number;

  @column()
  declare productId: number;

  @column()
  declare quantity: number;

  @column()
  declare price: number;

  @belongsTo(() => import('#models/order').then((m) => m.default))
  declare order: any;

  @belongsTo(() => Product)
  declare product: Product;
}
