import { inject } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import { Prisma, ReviewStatus, OrderStatus } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'
import EmailVerificationService from '#controllers/auth/services/email_verification_service'
export default class ReviewService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject() private emailVerificationService: EmailVerificationService,
    @inject() private cache: RedisCacheService
  ) {}

  private isMissingReviewTable(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021' &&
      (error.meta?.modelName === 'Review' || error.meta?.modelName === 'ReviewComment')
    )
  }

  private getUnavailableReviewPayload() {
    return {
      summary: {
        averageRating: 0,
        reviewCount: 0,
        ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: 0,
        })),
      },
      reviews: [],
    }
  }

  private getUnavailableFeaturedReviewPayload() {
    return {
      reviews: [],
    }
  }

  private readonly reviewInclude = {
    user: {
      select: {
        id: true,
        name: true,
      },
    },
    comments: {
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  } as const

  private async ensureProductExists(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    })

    if (!product) {
      throw { status: 404, message: 'Product not found' }
    }

    return product
  }

  private async getEligibleDeliveredOrder(userId: number, productId: number) {
    return this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        items: {
          some: {
            productId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    })
  }

  private sanitizeHtml(text: string | null): string | null {
    if (!text) return text
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  async getFeaturedReviews(limit = 6) {
    const cacheKey = `reviews:featured:${limit}`
    const cached = await this.cache.getJson<{
      reviews: {
        id: number
        title: string | null
        content: string
        user: { id: number; name: string }
        product: { id: number; name: string; image: string | null }
      }[]
    }>(cacheKey)

    if (cached) {
      return cached
    }

    let reviews: {
      id: number
      title: string | null
      content: string
      user: { id: number; name: string }
      product: { id: number; name: string; image: string | null }
    }[]

    try {
      reviews = await this.prisma.review.findMany({
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      })
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableFeaturedReviewPayload()
      }
      throw error
    }

    const result = {
      reviews: reviews.map((review) => ({
        ...review,
        title: review.title ? this.sanitizeHtml(review.title) : null,
        content: this.sanitizeHtml(review.content),
      })),
    }

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async getProductReviews(productId: number) {
    await this.ensureProductExists(productId)
    const cacheKey = `reviews:product:${productId}`
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey)
    if (cached) {
      return cached
    }

    let reviews: { rating: number; [key: string]: unknown }[]

    try {
      reviews = await this.prisma.review.findMany({
        where: { productId, status: ReviewStatus.APPROVED },
        include: this.reviewInclude,
        orderBy: [{ createdAt: 'desc' }],
      })
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableReviewPayload()
      }
      throw error
    }

    const reviewCount = reviews.length
    const averageRating =
      reviewCount > 0
        ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
        : 0

    const result = {
      summary: {
        averageRating,
        reviewCount,
        ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: reviews.filter((review) => review.rating === rating).length,
        })),
      },
      reviews: reviews.map((review) => ({
        ...review,
        title: review.title ? this.sanitizeHtml(review.title as string) : null,
        content: this.sanitizeHtml(review.content as string),
        comments:
          (review.comments as (Record<string, unknown> & { content: string })[] | undefined)?.map(
            (comment) => ({
              ...comment,
              content: this.sanitizeHtml(comment.content),
            })
          ) || [],
      })),
    }

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async getReviewEligibility(userId: number, productId: number) {
    await this.ensureProductExists(productId)

    try {
      const [existingReview, qualifyingOrder] = await Promise.all([
        this.prisma.review.findUnique({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
          select: { id: true },
        }),
        this.getEligibleDeliveredOrder(userId, productId),
      ])

      if (existingReview) {
        return {
          canReview: false,
          hasReviewed: true,
          reason: 'You already posted a review for this product.',
        }
      }

      if (!qualifyingOrder) {
        return {
          canReview: false,
          hasReviewed: false,
          reason: 'Buy this product first to unlock reviews.',
        }
      }

      return {
        canReview: true,
        hasReviewed: false,
        reason: 'You can rate and review this item.',
      }
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return {
          canReview: false,
          hasReviewed: false,
          reason: 'Reviews will be available after the database update is applied.',
        }
      }
      throw error
    }
  }

  async createReview(userId: number, productId: number, dto: Record<string, unknown>) {
    await this.ensureProductExists(productId)
    const content = String(dto.content)
    const title = dto.title !== undefined ? String(dto.title) || null : null

    if (!content) {
      throw { status: 400, message: 'Review content cannot be empty.' }
    }

    let existingReview: { id: number } | null
    let qualifyingOrder: { id: number } | null

    try {
      ;[existingReview, qualifyingOrder] = await Promise.all([
        this.prisma.review.findUnique({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
        }),
        this.getEligibleDeliveredOrder(userId, productId),
      ])
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw {
          status: 400,
          message:
            'Reviews are not available yet. Apply the latest database migration and try again.',
        }
      }
      throw error
    }

    if (existingReview) {
      throw { status: 409, message: 'You already reviewed this product.' }
    }

    if (!qualifyingOrder) {
      throw { status: 400, message: 'You can only review products you have purchased.' }
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          productId,
          orderId: qualifyingOrder.id,
          rating: Number(dto.rating),
          title,
          content,
          status: ReviewStatus.PENDING,
        },
        include: this.reviewInclude,
      })

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (user?.email) {
        await this.emailVerificationService.sendReviewPosted(user.email, user.name, userId)
      }

      await this.cache.del(`reviews:product:${productId}`)
      await this.cache.del('reviews:featured:6')

      return {
        ...review,
        title: review.title ? this.sanitizeHtml(review.title) : null,
        content: this.sanitizeHtml(review.content),
      }
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw {
          status: 400,
          message:
            'Reviews are not available yet. Apply the latest database migration and try again.',
        }
      }
      throw error
    }
  }

  async moderateReview(
    reviewId: number,
    dto: Record<string, unknown>
  ): Promise<{ id: number; status: ReviewStatus; adminNote: string | null }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, status: true, adminNote: true, productId: true },
    })

    if (!review) {
      throw { status: 404, message: 'Review not found' }
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: dto.status === 'APPROVED' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
        adminNote: dto.adminNote ?? null,
      },
      select: { id: true, status: true, adminNote: true },
    })

    await this.cache.del(`reviews:product:${review.productId}`)
    await this.cache.del('reviews:featured:6')

    return updatedReview
  }

  async getPendingReviews(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: ReviewStatus.PENDING },
        include: {
          user: {
            select: { id: true, name: true },
          },
          product: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { status: ReviewStatus.PENDING },
      }),
    ])

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async createComment(userId: number, reviewId: number, dto: Record<string, unknown>) {
    const content = String(dto.content)

    if (!content) {
      throw { status: 400, message: 'Comment content cannot be empty.' }
    }

    let review: { id: number; productId: number } | null

    try {
      review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true, productId: true },
      })
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw {
          status: 400,
          message:
            'Review comments are not available yet. Apply the latest database migration and try again.',
        }
      }
      throw error
    }

    if (!review) {
      throw { status: 404, message: 'Review not found' }
    }

    try {
      const comment = await this.prisma.reviewComment.create({
        data: {
          reviewId,
          userId,
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })

      if (user?.email) {
        await this.emailVerificationService.sendCommentPosted(user.email, user.name, userId)
      }

      await this.cache.del(`reviews:product:${review.productId}`)

      return {
        ...comment,
        content: this.sanitizeHtml(comment.content),
      }
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw {
          status: 400,
          message:
            'Review comments are not available yet. Apply the latest database migration and try again.',
        }
      }
      throw error
    }
  }
}
