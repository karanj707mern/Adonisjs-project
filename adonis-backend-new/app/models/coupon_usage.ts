import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class CouponUsage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare couponId: number;

  @column()
  declare userId: number;

  @column()
  declare orderId: number;

  @column.dateTime({ autoCreate: true })
  declare usedAt: DateTime;

  @belongsTo(() => Coupon)
  declare coupon: any;

  @belongsTo(() => User)
  declare user: any;

  @belongsTo(() => Order)
  declare order: any;
}
