import { injectable } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import { updateStoreSettingsValidator } from './settings_validators'

const STORE_SETTINGS_ID = 1

@injectable()
export default class SettingsService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('RedisCache') private cache: RedisCacheService,
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

    const existing = await this.prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
    })

    let result: Record<string, unknown>
    if (existing) {
      result = {
        ...existing,
        shippingOptions: this.buildShippingOptions(existing),
        shippingZones: existing.shippingZones ?? this.buildShippingZones(),
      }
    } else {
      result = await this.prisma.storeSettings.create({
        data: {
          id: STORE_SETTINGS_ID,
          shippingCharge: 99,
          expressShippingCharge: 149,
          sameDayShippingCharge: 249,
          codCharge: 25,
          handlingCharge: 20,
          taxRate: 0,
          freeShippingThreshold: 1500,
          shippingOptions: this.buildShippingOptions({
            shippingCharge: 99,
            expressShippingCharge: 149,
            sameDayShippingCharge: 249,
          }),
          shippingZones: this.buildShippingZones(),
          codEnabled: true,
          maxCodOrderValue: 5000,
          allowInternationalCod: false,
          autoCancelPendingMinutes: 30,
        },
      })
    }

    if (this.cache.isEnabled) {
      await this.cache.setJson(cacheKey, result, 300)
    }

    return result
  }

  async updateStoreSettings(data: Record<string, unknown>) {
    const cacheKey = 'store:settings'

    const settings = await this.prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
    })

    if (!settings) {
      const result = await this.prisma.storeSettings.create({
        data: {
          id: STORE_SETTINGS_ID,
          shippingCharge: data.shippingCharge as number,
          expressShippingCharge: data.expressShippingCharge as number,
          sameDayShippingCharge: data.sameDayShippingCharge as number,
          codCharge: data.codCharge as number,
          handlingCharge: data.handlingCharge as number,
          taxRate: data.taxRate as number,
          freeShippingThreshold: (data.freeShippingThreshold as number | null) ?? null,
          shippingOptions: this.buildShippingOptions({
            shippingCharge: data.shippingCharge as number,
            expressShippingCharge: data.expressShippingCharge as number,
            sameDayShippingCharge: data.sameDayShippingCharge as number,
          }),
          shippingZones: (data.shippingZones as unknown[] | null) ?? this.buildShippingZones(),
          codEnabled: (data.codEnabled as boolean | undefined) ?? true,
          maxCodOrderValue: (data.maxCodOrderValue as number | null | undefined) ?? 5000,
          allowInternationalCod: (data.allowInternationalCod as boolean | undefined) ?? false,
          autoCancelPendingMinutes: (data.autoCancelPendingMinutes as number | undefined) ?? 30,
        },
      })

      if (this.cache.isEnabled) {
        await this.cache.del(cacheKey)
      }

      return result
    }

    const result = await this.prisma.storeSettings.update({
      where: { id: STORE_SETTINGS_ID },
      data: {
        shippingCharge: data.shippingCharge as number,
        expressShippingCharge: data.expressShippingCharge as number,
        sameDayShippingCharge: data.sameDayShippingCharge as number,
        codCharge: data.codCharge as number,
        handlingCharge: data.handlingCharge as number,
        taxRate: data.taxRate as number,
        freeShippingThreshold: (data.freeShippingThreshold as number | null | undefined) ?? null,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: data.shippingCharge as number,
          expressShippingCharge: data.expressShippingCharge as number,
          sameDayShippingCharge: data.sameDayShippingCharge as number,
        }),
        shippingZones: (data.shippingZones as unknown[] | undefined) ?? (settings.shippingZones as unknown[] | null) ?? this.buildShippingZones(),
        codEnabled: (data.codEnabled as boolean | undefined) ?? settings.codEnabled,
        maxCodOrderValue: (data.maxCodOrderValue as number | null | undefined) ?? settings.maxCodOrderValue,
        allowInternationalCod: (data.allowInternationalCod as boolean | undefined) ?? settings.allowInternationalCod,
        autoCancelPendingMinutes: (data.autoCancelPendingMinutes as number | undefined) ?? settings.autoCancelPendingMinutes,
      },
    })

    if (this.cache.isEnabled) {
      await this.cache.del(cacheKey)
    }

    return result
  }
}
