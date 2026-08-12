import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class GiftCardController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ response }: HttpContext) {
    const giftCards = await this.prisma.giftCard.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: giftCards,
    })
  }

  async store({ request, response }: HttpContext) {
    const data = request.body()

    const giftCard = await this.prisma.giftCard.create({
      data: {
        code: data.code,
        initialAmount: data.initialAmount,
        remainingAmount: data.remainingAmount ?? data.initialAmount,
        currency: data.currency || 'INR',
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Gift card created successfully',
      data: giftCard,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const data = request.body()

    const giftCard = await this.prisma.giftCard.update({
      where: { id: parseInt(params.id) },
      data,
    })

    return response.json({
      statusCode: 200,
      message: 'Gift card updated successfully',
      data: giftCard,
    })
  }

  async destroy({ params, response }: HttpContext) {
    await this.prisma.giftCard.delete({
      where: { id: parseInt(params.id) },
    })

    return response.json({
      statusCode: 200,
      message: 'Gift card deleted successfully',
    })
  }

  async balance({ request, response }: HttpContext) {
    const code = request.input('code')

    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
    })

    if (!giftCard) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Gift card not found',
      })
    }

    return response.json({
      statusCode: 200,
      data: { balance: giftCard.remainingAmount },
    })
  }

  async redeem({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { code } = request.body()

    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
    })

    if (!giftCard || !giftCard.isActive) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Gift card not found or inactive',
      })
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Gift card expired',
      })
    }

    if (giftCard.remainingAmount <= 0) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Gift card has no balance',
      })
    }

    return response.json({
      statusCode: 200,
      data: { balance: giftCard.remainingAmount },
    })
  }
}
