import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class AdminAuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare action: string;

  @column()
  declare entityType: string;

  @column()
  declare entityId: number | null;

  @column()
  declare oldValue: string | null;

  @column()
  declare newValue: string | null;

  @column()
  declare ipAddress: string | null;

  @column()
  declare userAgent: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @belongsTo(() => User)
  declare user: any;
}
