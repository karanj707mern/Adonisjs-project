import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AbandonedCart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare guestToken: string | null

  @column()
  declare productId: number

  @column()
  declare quantity: number

  @column()
  declare recovered: boolean

  @column.dateTime()
  declare recoveredAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => User)
  declare user: any

  @belongsTo(() => Product)
  declare product: any
}
