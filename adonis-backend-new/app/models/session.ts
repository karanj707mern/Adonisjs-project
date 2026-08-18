import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class Session extends BaseModel {
  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare userId: number;

  @column({ unique: true })
  declare refreshToken: string;

  @column()
  declare userAgent: string | null;

  @column()
  declare ip: string | null;

  @column()
  declare country: string | null;

  @column()
  declare city: string | null;

  @column()
  declare device: string | null;

  @column()
  declare browser: string | null;

  @column()
  declare os: string | null;

  @column.dateTime()
  declare expiresAt: DateTime;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column.dateTime()
  declare lastUsedAt: DateTime;

  @belongsTo(() => User)
  declare user: any;
}
