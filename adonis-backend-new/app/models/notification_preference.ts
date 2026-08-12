import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class NotificationPreference extends BaseModel {
  static table = 'notification_preferences'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare type: string

  @column()
  declare channel: 'EMAIL' | 'SMS' | 'WHATSAPP'

  @column({ defaultValue: true })
  declare enabled: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
