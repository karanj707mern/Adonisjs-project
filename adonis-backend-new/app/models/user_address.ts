import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class UserAddress extends BaseModel {
  static table = 'user_addresses'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare label: string

  @column()
  declare recipientName: string

  @column()
  declare phoneNumber: string

  @column()
  declare addressLine1: string

  @column({ nullable: true })
  declare addressLine2: string | null

  @column()
  declare city: string

  @column()
  declare state: string

  @column()
  declare postalCode: string

  @column()
  declare country: string

  @column({ defaultValue: false })
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
