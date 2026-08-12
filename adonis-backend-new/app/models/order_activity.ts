import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class OrderActivity extends BaseModel {
  static table = 'order_activities'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare status: string

  @column()
  declare title: string

  @column()
  declare detail: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
