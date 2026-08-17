import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class StoreSettings extends BaseModel {
  static table = 'store_settings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shippingCharge: number

  @column()
  declare taxRate: number

  @column()
  declare freeShippingThreshold: number | null

  @column()
  declare codCharge: number

  @column()
  declare expressShippingCharge: number

  @column()
  declare handlingCharge: number

  @column()
  declare sameDayShippingCharge: number

  @column()
  declare shippingOptions: unknown

  @column()
  declare shippingZones: unknown

  @column()
  declare codEnabled: boolean

  @column()
  declare maxCodOrderValue: number | null

  @column()
  declare allowInternationalCod: boolean

  @column()
  declare autoCancelPendingMinutes: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
