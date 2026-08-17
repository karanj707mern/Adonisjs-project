import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class RecentlyViewed extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column.dateTime({ autoCreate: true })
  declare viewedAt: DateTime

  @belongsTo(() => User)
  declare user: any

  @belongsTo(() => Product)
  declare product: any
}
