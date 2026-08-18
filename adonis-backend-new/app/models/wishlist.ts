import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class Wishlist extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare productId: number;

  @column()
  declare guestWishlistToken: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @belongsTo(() => User)
  declare user: any;

  @belongsTo(() => Product)
  declare product: any;
}
