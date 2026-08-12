import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Review extends BaseModel {
  static table = 'reviews'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column({ nullable: true })
  declare orderId: number | null

  @column()
  declare rating: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column({ defaultValue: 'PENDING' })
  declare status: 'PENDING' | 'APPROVED' | 'REJECTED'

  @column({ columnName: 'admin_note', nullable: true })
  declare adminNote: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => import('#models/review_comment'))
  declare comments: any[]
}
