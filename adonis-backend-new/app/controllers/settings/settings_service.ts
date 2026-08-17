import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import { updateStoreSettingsValidator } from './settings_validators'

const STORE_SETTINGS_ID = 1

@injectable()
export default class SettingsService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
  ) {}

  private buildShippingZones() {
    return [
      {
        key: 'DOMESTIC',
        label: 'India',
        countries: ['india'],
        allowedShippingTypes: ['standard', 'express', 'sameDay', 'prime'],
        taxRate: null,
        shippingMultiplier: 1,
      },
      {
        key: 'INTERNATIONAL',
        label: 'Rest of world',
        countries: [],
        allowedShippingTypes: ['standard'],
        taxRate: 0,
        shippingMultiplier: 2,
      },
    ]
  }

  private buildShippingOptions(settings: {
    shippingCharge: number
    expressShippingCharge: number
    sameDayShippingCharge: number
  }) {
    return [
      {
        key: 'standard',
        label: 'Standard Delivery',
        amount: settings.shippingCharge,
        etaDays: 4,
      },
      {
        key: 'express',
        label: 'Express Delivery',
        amount: settings.expressShippingCharge,
        etaDays: 2,
      },
      {
        key: 'sameDay',
        label: 'Same Day Delivery',
        amount: settings.sameDayShippingCharge,
        etaDays: 1,
      },
    ]
  }

  async getStoreSettings() {
    const cacheKey = 'store:settings'
    const cached = await this.cache.getJson<unknown>(cacheKey)
    if (cached) {
      return cached
    }

    const existing = await this.db
      .table('store_settings')
      .where('id', STORE_SETTINGS_ID)
      .first()

    let result: Record<string, unknown>
    if (existing) {
      result = {
        ...existing,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: Number(existing.shipping_charge),
          expressShippingCharge: Number(existing.express_shipping_charge),
          sameDayShippingCharge: Number(existing.same_day_shipping_charge),
        }),
        shippingZones:
          existing.shipping_zones ?? this.buildShippingZones(),
      }
    } else {
      const insertId = await this.db.table('store_settings').insert({
        id: STORE_SETTINGS_ID,
        shipping_charge: 99,
        express_shipping_charge: 149,
        same_day_shipping_charge: 249,
        cod_charge: 25,
        handling_charge: 20,
        tax_rate: 0,
        free_shipping_threshold: 1500,
        shipping_options: this.buildShippingOptions({
          shippingCharge: 99,
          expressShippingCharge: 149,
          sameDayShippingCharge: 249,
        }),
        shipping_zones: this.buildShippingZones(),
        cod_enabled: true,
        max_cod_order_value: 5000,
        allow_international_cod: false,
        auto_cancel_pending_minutes: 30,
      })

      const [row] = await this.db
        .table('store_settings')
        .where('id', insertId[0])
        .first()

      result = {
        ...row,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: Number(row.shipping_charge),
          expressShippingCharge: Number(row.express_shipping_charge),
          sameDayShippingCharge: Number(row.same_day_shipping_charge),
        }),
        shippingZones: row.shipping_zones ?? this.buildShippingZones(),
      }
    }

    if (this.cache.isEnabled) {
      await this.cache.setJson(cacheKey, result, 300)
    }

    return result
  }

  async updateStoreSettings(data: Record<string, unknown>) {
    const cacheKey = 'store:settings'

    const settings = await this.db
      .table('store_settings')
      .where('id', STORE_SETTINGS_ID)
      .first()

    if (!settings) {
      const insertId = await this.db.table('store_settings').insert({
        id: STORE_SETTINGS_ID,
        shipping_charge: data.shippingCharge as number,
        express_shipping_charge: data.expressShippingCharge as number,
        same_day_shipping_charge: data.sameDayShippingCharge as number,
        cod_charge: data.codCharge as number,
        handling_charge: data.handlingCharge as number,
        tax_rate: data.taxRate as number,
        free_shipping_threshold:
          (data.freeShippingThreshold as number | null) ?? null,
        shipping_options: this.buildShippingOptions({
          shippingCharge: data.shippingCharge as number,
          expressShippingCharge: data.expressShippingCharge as number,
          sameDayShippingCharge: data.sameDayShippingCharge as number,
        }),
        shipping_zones:
          (data.shippingZones as unknown[] | null) ??
          this.buildShippingZones(),
        cod_enabled: (data.codEnabled as boolean | undefined) ?? true,
        max_cod_order_value:
          (data.maxCodOrderValue as number | null | undefined) ?? 5000,
        allow_international_cod:
          (data.allowInternationalCod as boolean | undefined) ?? false,
        auto_cancel_pending_minutes:
          (data.autoCancelPendingMinutes as number | undefined) ?? 30,
      })

      const [result] = await this.db
        .table('store_settings')
        .where('id', insertId[0])
        .first()

      if (this.cache.isEnabled) {
        await this.cache.del(cacheKey)
      }

      return result
    }

    await this.db.table('store_settings').where('id', STORE_SETTINGS_ID).update({
      shipping_charge: data.shippingCharge as number,
      express_shipping_charge: data.expressShippingCharge as number,
      same_day_shipping_charge: data.sameDayShippingCharge as number,
      cod_charge: data.codCharge as number,
      handling_charge: data.handlingCharge as number,
      tax_rate: data.taxRate as number,
      free_shipping_threshold:
        (data.freeShippingThreshold as number | null | undefined) ?? null,
      shipping_options: this.buildShippingOptions({
        shippingCharge: data.shippingCharge as number,
        expressShippingCharge: data.expressShippingCharge as number,
        sameDayShippingCharge: data.sameDayShippingCharge as number,
      }),
      shipping_zones:
        (data.shippingZones as unknown[] | undefined) ??
        (settings.shipping_zones as unknown[] | null) ??
        this.buildShippingZones(),
      cod_enabled:
        (data.codEnabled as boolean | undefined) ?? settings.cod_enabled,
      max_cod_order_value:
        (data.maxCodOrderValue as number | null | undefined) ??
        settings.max_cod_order_value,
      allow_international_cod:
        (data.allowInternationalCod as boolean | undefined) ??
        settings.allow_international_cod,
      auto_cancel_pending_minutes:
        (data.autoCancelPendingMinutes as number | undefined) ??
        settings.auto_cancel_pending_minutes,
    })

    const [result] = await this.db
      .table('store_settings')
      .where('id', STORE_SETTINGS_ID)
      .first()

    if (this.cache.isEnabled) {
      await this.cache.del(cacheKey)
    }

    return result
  }
}
