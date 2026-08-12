import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class User extends BaseModel {
  static table = 'users'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ unique: true })
  declare email: string

  @column()
  declare password: string

  @column({ columnName: 'is_email_verified', defaultValue: false })
  declare isEmailVerified: boolean

  @column()
  declare role: 'USER' | 'ADMIN'

  @column()
  declare authProvider: 'LOCAL' | 'GOOGLE'

  @column({ columnName: 'google_id', unique: true, nullable: true })
  declare googleId: string | null

  @column({ nullable: true })
  declare phoneNumber: string | null

  @column({ nullable: true })
  declare avatar: string | null

  @column({ columnName: 'refresh_token', nullable: true })
  declare refreshToken: string | null

  @column({ columnName: 'refresh_token_expires_at', nullable: true })
  declare refreshTokenExpiresAt: Date | null

  @column({ nullable: true })
  declare addressLine1: string | null

  @column({ nullable: true })
  declare addressLine2: string | null

  @column({ nullable: true })
  declare city: string | null

  @column({ nullable: true })
  declare state: string | null

  @column({ nullable: true })
  declare postalCode: string | null

  @column({ nullable: true })
  declare country: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => import('#models/user_address'))
  declare addresses: any[]

  @hasMany(() => import('#models/order'))
  declare orders: any[]

  @hasMany(() => import('#models/review'))
  declare reviews: any[]

  @hasMany(() => import('#models/cart_item'))
  declare cartItems: any[]

  @hasMany(() => import('#models/wishlist'))
  declare wishlistItems: any[]

  @hasMany(() => import('#models/notification'))
  declare notifications: any[]
}
