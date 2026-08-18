import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import type { DateTime } from 'luxon';
import Order from '#models/order';

export default class OrderActivity extends BaseModel {
  static table = 'order_activities';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare orderId: number;

  @column()
  declare status: string;

  @column()
  declare title: string;

  @column()
  declare detail: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @belongsTo(() => Order)
  declare order: Order;
}
