import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export default class Review extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare productId: number;

  @column()
  declare orderId: number | null;

  @column()
  declare rating: number;

  @column()
  declare title: string | null;

  @column()
  declare content: string;

  @column()
  declare adminNote: string | null;

  @column()
  declare status: ReviewStatus;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => User)
  declare user: any;

  @belongsTo(() => Product)
  declare product: any;

  @belongsTo(() => Order)
  declare order: any;

  @hasMany(() => ReviewComment)
  declare comments: any[];
}
