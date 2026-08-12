import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class SettingsController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async show({ response }: HttpContext) {
    let settings = await this.prisma.storeSettings.findFirst()

    if (!settings) {
      settings = await this.prisma.storeSettings.create({
        data: {
          id: 1,
          shippingCharge: 50,
          taxRate: 0.05,
          freeShippingThreshold: 999,
          codCharge: 0,
          expressShippingCharge: 150,
          handlingCharge: 0,
          sameDayShippingCharge: 300,
          codEnabled: true,
          autoCancelPendingMinutes: 30,
        },
      })
    }

    return response.json({
      statusCode: 200,
      data: settings,
    })
  }

  async update({ request, response }: HttpContext) {
    const data = request.body()

    const settings = await this.prisma.storeSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        shippingCharge: data.shippingCharge ?? 50,
        taxRate: data.taxRate ?? 0.05,
        freeShippingThreshold: data.freeShippingThreshold ?? 999,
        codCharge: data.codCharge ?? 0,
        expressShippingCharge: data.expressShippingCharge ?? 150,
        handlingCharge: data.handlingCharge ?? 0,
        sameDayShippingCharge: data.sameDayShippingCharge ?? 300,
        codEnabled: data.codEnabled ?? true,
        autoCancelPendingMinutes: data.autoCancelPendingMinutes ?? 30,
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Settings updated successfully',
      data: settings,
    })
  }
}
