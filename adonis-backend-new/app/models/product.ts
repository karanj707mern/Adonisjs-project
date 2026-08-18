import { BaseModel, column } from '@adonisjs/lucid/orm';
import type { DateTime } from 'luxon';

export default class Product extends BaseModel {
  static table = 'products';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare price: number;

  @column()
  declare description: string;

  @column()
  declare image: string;

  @column()
  declare stock: number;

  @column()
  declare slug: string;

  @column()
  declare sku: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
