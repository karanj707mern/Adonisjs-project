import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import OrderItem from '#models/order_item'
import OrderActivity from '#models/order_activity'

export default class Order extends BaseModel {
  static table = 'orders'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare total: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column()
  declare status: string

  @column()
  declare addressLine1: string | null

  @column()
  declare addressLine2: string | null

  @column()
  declare city: string | null

  @column()
  declare country: string | null

  @column()
  declare courierName: string | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare estimatedDeliveryAt: DateTime | null

  @column.dateTime()
  declare outForDeliveryAt: DateTime | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column()
  declare phoneNumber: string | null

  @column()
  declare postalCode: string | null

  @column()
  declare razorpayOrderId: string | null

  @column()
  declare razorpayPaymentId: string | null

  @column()
  declare recipientName: string | null

  @column.dateTime()
  declare shippedAt: DateTime | null

  @column()
  declare shippingAmount: number

  @column()
  declare state: string | null

  @column()
  declare subtotal: number

  @column()
  declare taxAmount: number

  @column()
  declare trackingNumber: string | null

  @column()
  declare codAmount: number

  @column()
  declare handlingAmount: number

  @column()
  declare shippingType: string | null

  @column()
  declare paymentMethod: string | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column()
  declare inventoryReserved: boolean

  @column()
  declare couponCode: string | null

  @column()
  declare refundMethod: string | null

  @column()
  declare refundReference: string | null

  @column()
  declare refundNotes: string | null

  @column()
  declare adminNotes: string | null

  @column()
  declare refundId: string | null

  @column.dateTime()
  declare refundedAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => OrderItem)
  declare items: OrderItem[]

  @hasMany(() => OrderActivity)
  declare activities: OrderActivity[]
}
