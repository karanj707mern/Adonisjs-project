import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Product extends BaseModel {
  static table = 'products'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare price: number

  @column()
  declare description: string

  @column()
  declare image: string

  @column()
  declare stock: number

  @column({ unique: true })
  declare slug: string

  @column({ unique: true })
  declare sku: string

  @column({ columnName: 'compare_at_price', nullable: true })
  declare compareAtPrice: number | null

  @column({ nullable: true })
  declare brand: string | null

  @column({ nullable: true })
  declare tags: string[]

  @column({ columnName: 'seo_title', nullable: true })
  declare seoTitle: string | null

  @column({ columnName: 'seo_description', nullable: true })
  declare seoDescription: string | null

  @column({ columnName: 'weight_grams', nullable: true })
  declare weightGrams: number | null

  @column({ defaultValue: true })
  declare isActive: boolean

  @column({ columnName: 'is_new_arrival', defaultValue: false })
  declare isNewArrival: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => import('#models/review'))
  declare reviews: any[]

  @hasMany(() => import('#models/cart_item'))
  declare cartItems: any[]

  @hasMany(() => import('#models/order_item'))
  declare orderItems: any[]

  @hasMany(() => import('#models/wishlist'))
  declare wishlistItems: any[]
}
