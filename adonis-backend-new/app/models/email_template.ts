import { BaseModel, column } from '@adonisjs/lucid/orm';
import type { DateTime } from 'luxon';

export default class EmailTemplate extends BaseModel {
  static table = 'email_templates';

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare subject: string;

  @column()
  declare htmlBody: string;

  @column()
  declare textBody: string | null;

  @column()
  declare variables: unknown;

  @column()
  declare isActive: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
