import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class BlogPost extends BaseModel {
  static table = 'blog_posts'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column({ unique: true })
  declare slug: string

  @column()
  declare excerpt: string

  @column()
  declare content: string

  @column({ columnName: 'cover_image', nullable: true })
  declare coverImage: string | null

  @column({ defaultValue: false })
  declare published: boolean

  @column({ columnName: 'published_at', nullable: true })
  declare publishedAt: Date | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
