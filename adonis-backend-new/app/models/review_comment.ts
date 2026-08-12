import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ReviewComment extends BaseModel {
  static table = 'review_comments'
  static primaryKey = 'id'

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
}
