import { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import { BadRequestException, NotFoundException } from '@adonisjs/core/http';
import { updateStoreSettingsValidator } from './settings_validators';

const STORE_SETTINGS_ID = 1;

export default class SettingsService {
  constructor(
    private prisma: PrismaClient,
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
    ];
  }

  private buildShippingOptions(settings: {
    shippingCharge: number;
    expressShippingCharge: number;
    sameDayShippingCharge: number;
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
    ];
  }

  async getStoreSettings() {
    const cacheKey = 'store:settings';
    const cached = await this.cache.getJson<unknown>(cacheKey);
    if (cached) {
      return cached;
    }

    const existing = await this.prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
    });

    let result: Record<string, unknown>;
    if (existing) {
      result = {
        ...existing,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: Number(existing.shippingCharge),
          expressShippingCharge: Number(existing.expressShippingCharge),
          sameDayShippingCharge: Number(existing.sameDayShippingCharge),
        }),
        shippingZones: existing.shippingZones ?? this.buildShippingZones(),
      };
    } else {
      const settings = this.buildShippingOptions({
        shippingCharge: 99,
        expressShippingCharge: 149,
        sameDayShippingCharge: 249,
      });

      const created = await this.prisma.storeSettings.create({
        data: {
          id: STORE_SETTINGS_ID,
          shippingCharge: 99,
          expressShippingCharge: 149,
          sameDayShippingCharge: 249,
          codCharge: 25,
          handlingCharge: 20,
          taxRate: 0,
          freeShippingThreshold: 1500,
          shippingOptions: settings,
          shippingZones: this.buildShippingZones(),
          codEnabled: true,
          maxCodOrderValue: 5000,
          allowInternationalCod: false,
          autoCancelPendingMinutes: 30,
        },
      });

      result = {
        ...created,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: Number(created.shippingCharge),
          expressShippingCharge: Number(created.expressShippingCharge),
          sameDayShippingCharge: Number(created.sameDayShippingCharge),
        }),
        shippingZones: created.shippingZones ?? this.buildShippingZones(),
      };
    }

    if (this.cache.isEnabled) {
      await this.cache.setJson(cacheKey, result, 300);
    }

    return result;
  }

  async updateStoreSettings(data: Record<string, unknown>) {
    const cacheKey = 'store:settings';

    const existing = await this.prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
    });

    if (!existing) {
      const settings = this.buildShippingOptions({
        shippingCharge: data.shippingCharge as number,
        expressShippingCharge: data.expressShippingCharge as number,
        sameDayShippingCharge: data.sameDayShippingCharge as number,
      });

      const created = await this.prisma.storeSettings.create({
        data: {
          id: STORE_SETTINGS_ID,
          shippingCharge: data.shippingCharge as number,
          expressShippingCharge: data.expressShippingCharge as number,
          sameDayShippingCharge: data.sameDayShippingCharge as number,
          codCharge: data.codCharge as number,
          handlingCharge: data.handlingCharge as number,
          taxRate: data.taxRate as number,
          freeShippingThreshold:
            (data.freeShippingThreshold as number | null) ?? undefined,
          shippingOptions: settings,
          shippingZones:
            (data.shippingZones as unknown[] | null) ??
            this.buildShippingZones(),
          codEnabled: (data.codEnabled as boolean | undefined) ?? true,
          maxCodOrderValue:
            (data.maxCodOrderValue as number | null | undefined) ?? 5000,
          allowInternationalCod:
            (data.allowInternationalCod as boolean | undefined) ?? false,
          autoCancelPendingMinutes:
            (data.autoCancelPendingMinutes as number | undefined) ?? 30,
        },
      });

      if (this.cache.isEnabled) {
        await this.cache.del(cacheKey);
      }

      return created;
    }

    const shippingZones =
      (data.shippingZones as unknown[] | undefined) ??
      (existing.shippingZones as unknown[] | null) ??
      this.buildShippingZones();

    const updated = await this.prisma.storeSettings.update({
      where: { id: STORE_SETTINGS_ID },
      data: {
        shippingCharge: data.shippingCharge as number,
        expressShippingCharge: data.expressShippingCharge as number,
        sameDayShippingCharge: data.sameDayShippingCharge as number,
        codCharge: data.codCharge as number,
        handlingCharge: data.handlingCharge as number,
        taxRate: data.taxRate as number,
        freeShippingThreshold:
          (data.freeShippingThreshold as number | null | undefined) ??
          existing.freeShippingThreshold,
        shippingOptions: this.buildShippingOptions({
          shippingCharge: data.shippingCharge as number,
          expressShippingCharge: data.expressShippingCharge as number,
          sameDayShippingCharge: data.sameDayShippingCharge as number,
        }),
        shippingZones,
        codEnabled:
          (data.codEnabled as boolean | undefined) ?? existing.codEnabled,
        maxCodOrderValue:
          (data.maxCodOrderValue as number | null | undefined) ??
          existing.maxCodOrderValue,
        allowInternationalCod:
          (data.allowInternationalCod as boolean | undefined) ??
          existing.allowInternationalCod,
        autoCancelPendingMinutes:
          (data.autoCancelPendingMinutes as number | undefined) ??
          existing.autoCancelPendingMinutes,
      },
    });

    if (this.cache.isEnabled) {
      await this.cache.del(cacheKey);
    }

    return updated;
  }
}
