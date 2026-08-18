import { BaseModel, column } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';

export default class BlogPost extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare title: string;

  @column({ unique: true })
  declare slug: string;

  @column()
  declare excerpt: string | null;

  @column()
  declare content: string;

  @column()
  declare coverImage: string | null;

  @column()
  declare published: boolean;

  @column.dateTime()
  declare publishedAt: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
