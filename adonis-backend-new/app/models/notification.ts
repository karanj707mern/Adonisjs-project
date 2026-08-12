import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Notification extends BaseModel {
  static table = 'notifications'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ nullable: true })
  declare userId: number | null

  @column({ nullable: true })
  declare orderId: number | null

  @column()
  declare type: string

  @column()
  declare channel: 'EMAIL' | 'SMS' | 'WHATSAPP'

  @column()
  declare recipient: string

  @column()
  declare subject: string

  @column()
  declare body: string

  @column({ nullable: true })
  declare payload: any

  @column({ defaultValue: 'PENDING' })
  declare status: 'PENDING' | 'SENT' | 'FAILED'

  @column({ defaultValue: 0 })
  declare attempts: number

  @column({ columnName: 'max_attempts', defaultValue: 3 })
  declare maxAttempts: number

  @column({ columnName: 'last_error', nullable: true })
  declare lastError: string | null

  @column({ columnName: 'provider_message_id', nullable: true })
  declare providerMessageId: string | null

  @column({ columnName: 'scheduled_at', nullable: true })
  declare scheduledAt: Date | null

  @column({ columnName: 'sent_at', nullable: true })
  declare sentAt: Date | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
