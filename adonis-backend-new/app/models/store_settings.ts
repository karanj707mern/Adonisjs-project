import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class StoreSettings extends BaseModel {
  static table = 'store_settings'
  static primaryKey = 'id'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'shipping_charge' })
  declare shippingCharge: number

  @column({ columnName: 'tax_rate' })
  declare taxRate: number

  @column({ columnName: 'free_shipping_threshold' })
  declare freeShippingThreshold: number

  @column({ columnName: 'cod_charge', nullable: true })
  declare codCharge: number | null

  @column({ columnName: 'express_shipping_charge', nullable: true })
  declare expressShippingCharge: number | null

  @column({ columnName: 'handling_charge', nullable: true })
  declare handlingCharge: number | null

  @column({ columnName: 'same_day_shipping_charge', nullable: true })
  declare sameDayShippingCharge: number | null

  @column({ columnName: 'shipping_options', nullable: true })
  declare shippingOptions: any

  @column({ columnName: 'shipping_zones', nullable: true })
  declare shippingZones: any

  @column({ columnName: 'cod_enabled', defaultValue: true })
  declare codEnabled: boolean

  @column({ columnName: 'max_cod_order_value', nullable: true })
  declare maxCodOrderValue: number | null

  @column({ columnName: 'allow_international_cod', defaultValue: false })
  declare allowInternationalCod: boolean

  @column({ columnName: 'auto_cancel_pending_minutes', defaultValue: 30 })
  declare autoCancelPendingMinutes: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
