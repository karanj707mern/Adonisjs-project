import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Session extends BaseModel {
  static table = 'sessions'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column({ unique: true })
  declare refreshToken: string

  @column({ nullable: true })
  declare userAgent: string | null

  @column({ nullable: true })
  declare ip: string | null

  @column({ nullable: true })
  declare country: string | null

  @column({ nullable: true })
  declare city: string | null

  @column({ nullable: true })
  declare device: string | null

  @column({ nullable: true })
  declare browser: string | null

  @column({ nullable: true })
  declare os: string | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ nullable: true })
  declare lastUsedAt: DateTime | null
}
