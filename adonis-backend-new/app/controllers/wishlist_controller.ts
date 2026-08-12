import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class WishlistController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ auth, response }: HttpContext) {
    const user = auth.user as any

    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId: user.id },
      include: { product: true },
    })

    return response.json({
      statusCode: 200,
      data: wishlist,
    })
  }

  async add({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { productId } = request.body()

    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
      include: { product: true },
    })

    return response.json({
      statusCode: 200,
      data: wishlistItem,
    })
  }

  async remove({ auth, params, response }: HttpContext) {
    const user = auth.user as any

    await this.prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        productId: parseInt(params.productId),
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Item removed from wishlist',
    })
  }
}
