import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class ReviewController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async featured({ response }: HttpContext) {
    const reviews = await this.prisma.review.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { name: true } } },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: reviews,
    })
  }

  async index({ response }: HttpContext) {
    const reviews = await this.prisma.review.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: reviews,
    })
  }

  async productReviews({ params, response }: HttpContext) {
    const reviews = await this.prisma.review.findMany({
      where: {
        productId: parseInt(params.productId),
        status: 'APPROVED',
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: reviews,
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user as any
    const { productId, rating, title, content } = request.body()

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title,
        content,
        status: 'PENDING',
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Review submitted for moderation',
      data: review,
    })
  }
}
