import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class NewArrival extends BaseModel {
  static table = 'new_arrival'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare url: string

  @column()
  declare alt: string

  @column()
  declare sortOrder: number

  @column({ defaultValue: true })
  declare active: boolean

  @column({ defaultValue: false })
  declare comingSoon: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
