import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AdminAuditLog extends BaseModel {
  static table = 'admin_audit_logs'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare action: string

  @column()
  declare entityType: string

  @column({ columnName: 'entity_id', nullable: true })
  declare entityId: number | null

  @column({ columnName: 'old_value', nullable: true })
  declare oldValue: any

  @column({ columnName: 'new_value', nullable: true })
  declare newValue: any

  @column({ columnName: 'ip_address', nullable: true })
  declare ipAddress: string | null

  @column({ columnName: 'user_agent', nullable: true })
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
