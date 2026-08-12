import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Order extends BaseModel {
  static table = 'orders'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare total: number

  @column()
  declare status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'OUT_FOR_DELIVERY'

  @column()
  declare subtotal: number

  @column({ columnName: 'shipping_amount' })
  declare shippingAmount: number

  @column({ columnName: 'tax_amount' })
  declare taxAmount: number

  @column({ columnName: 'handling_amount', nullable: true })
  declare handlingAmount: number | null

  @column({ columnName: 'cod_amount', nullable: true })
  declare codAmount: number | null

  @column()
  declare shippingType: string

  @column()
  declare paymentMethod: string

  @column()
  declare recipientName: string

  @column()
  declare phoneNumber: string

  @column()
  declare addressLine1: string

  @column({ nullable: true })
  declare addressLine2: string | null

  @column()
  declare city: string

  @column()
  declare state: string

  @column()
  declare postalCode: string

  @column()
  declare country: string

  @column({ nullable: true })
  declare courierName: string | null

  @column({ nullable: true })
  declare trackingNumber: string | null

  @column({ columnName: 'delivered_at', nullable: true })
  declare deliveredAt: Date | null

  @column({ columnName: 'estimated_delivery_at', nullable: true })
  declare estimatedDeliveryAt: Date | null

  @column({ columnName: 'out_for_delivery_at', nullable: true })
  declare outForDeliveryAt: Date | null

  @column({ columnName: 'paid_at', nullable: true })
  declare paidAt: Date | null

  @column({ columnName: 'shipped_at', nullable: true })
  declare shippedAt: Date | null

  @column({ columnName: 'razorpay_order_id', nullable: true })
  declare razorpayOrderId: string | null

  @column({ columnName: 'razorpay_payment_id', unique: true, nullable: true })
  declare razorpayPaymentId: string | null

  @column({ columnName: 'coupon_code', nullable: true })
  declare couponCode: string | null

  @column({ nullable: true })
  declare refund: any

  @column({ columnName: 'admin_notes', nullable: true })
  declare adminNotes: string | null

  @column({ columnName: 'expires_at', nullable: true })
  declare expiresAt: Date | null

  @column({ columnName: 'inventory_reserved', defaultValue: false })
  declare inventoryReserved: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => import('#models/order_item'))
  declare items: any[]

  @hasMany(() => import('#models/order_activity'))
  declare activities: any[]
}
