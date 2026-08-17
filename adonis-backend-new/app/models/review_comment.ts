import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ReviewComment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare reviewId: number

  @column()
  declare userId: number

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Review)
  declare review: any

  @belongsTo(() => User)
  declare user: any
}
