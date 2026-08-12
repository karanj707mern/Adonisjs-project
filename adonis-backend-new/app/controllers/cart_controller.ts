import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class CartController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ auth, response }: HttpContext) {
    const user = auth.user as any

    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    })

    return response.json({
      statusCode: 200,
      data: cartItems,
    })
  }

  async add({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { productId, quantity } = request.body()

    const cartItem = await this.prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: { quantity },
      create: {
        userId: user.id,
        productId,
        quantity,
      },
    })

    return response.json({
      statusCode: 200,
      data: cartItem,
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user as any
    const { quantity } = request.body()

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: parseInt(params.productId),
      },
    })

    if (!cartItem) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Cart item not found',
      })
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    })

    return response.json({
      statusCode: 200,
      data: updated,
    })
  }

  async remove({ auth, params, response }: HttpContext) {
    const user = auth.user as any

    await this.prisma.cartItem.deleteMany({
      where: {
        userId: user.id,
        productId: parseInt(params.productId),
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Item removed from cart',
    })
  }
}
