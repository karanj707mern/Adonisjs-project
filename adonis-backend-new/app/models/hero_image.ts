import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class HeroImage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare url: string;

  @column()
  declare alt: string | null;

  @column()
  declare sortOrder: number;

  @column()
  declare active: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
