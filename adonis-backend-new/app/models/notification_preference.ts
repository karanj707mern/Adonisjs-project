import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { NotificationChannel } from './notification';
import { DateTime } from 'luxon';

export default class NotificationPreference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare type: string;

  @column()
  declare channel: NotificationChannel;

  @column()
  declare enabled: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => User)
  declare user: any;
}
