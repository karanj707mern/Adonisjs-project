import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import type { DateTime } from 'luxon';
import User from '#models/user';

export default class UserAddress extends BaseModel {
  static table = 'user_addresses';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare label: string;

  @column()
  declare recipientName: string;

  @column()
  declare phoneNumber: string;

  @column()
  declare addressLine1: string;

  @column()
  declare addressLine2: string | null;

  @column()
  declare city: string;

  @column()
  declare state: string;

  @column()
  declare postalCode: string;

  @column()
  declare country: string;

  @column()
  declare isDefault: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => User)
  declare user: User;
}
