import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class RecentlyViewed extends BaseModel {
  static table = 'recently_viewed'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column.dateTime()
  declare viewedAt: DateTime
}
