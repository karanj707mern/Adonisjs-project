import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class EmailTemplate extends BaseModel {
  static table = 'email_templates'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ unique: true })
  declare name: string

  @column()
  declare subject: string

  @column({ columnName: 'html_body' })
  declare htmlBody: string

  @column({ columnName: 'text_body', nullable: true })
  declare textBody: string | null

  @column({ nullable: true })
  declare variables: any

  @column({ defaultValue: true })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
