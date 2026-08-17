import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import type { DatabaseQueryException } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'
import EmailVerificationService from '#controllers/auth/services/email_verification_service'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@adonisjs/core/http'
import { ReviewStatus } from '#models/review'

@injectable()
export default class ReviewService {
  constructor(
    private db: Database,
    private emailVerificationService: EmailVerificationService,
    private cache: RedisCacheService,
  ) {}

  private isMissingReviewTable(error: unknown) {
    return (
      error instanceof DatabaseQueryException &&
      error.code === '42P01'
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

  private async ensureProductExists(productId: number) {
    const product = await this.db
      .table('products')
      .where('id', productId)
      .select('id', 'name')
      .first()

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    return product
  }

  private async getEligibleDeliveredOrder(userId: number, productId: number) {
    return this.db
      .table('reviews')
      .join('order_items', 'reviews.id', 'order_items.id')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('reviews.user_id', userId)
      .where('orders.status', 'DELIVERED')
      .where('order_items.product_id', productId)
      .select('orders.id', 'orders.status', 'orders.created_at')
      .orderBy('orders.created_at', 'desc')
      .first()
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
      reviews = await this.db
        .table('reviews')
        .join('users', 'reviews.user_id', 'users.id')
        .join('products', 'reviews.product_id', 'products.id')
        .where('reviews.status', ReviewStatus.APPROVED)
        .select(
          'reviews.id',
          'reviews.title',
          'reviews.content',
          'reviews.created_at',
          'users.id as user_id',
          'users.name as user_name',
          'products.id as product_id',
          'products.name as product_name',
          'products.image as product_image',
        )
        .orderBy('reviews.created_at', 'desc')
        .limit(limit)
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableFeaturedReviewPayload()
      }
      throw error
    }

    const result = {
      reviews: reviews.map((review) => ({
        id: review.id,
        title: review.title ? this.sanitizeHtml(review.title as string) : null,
        content: this.sanitizeHtml(review.content as string),
        user: { id: review.user_id, name: review.user_name },
        product: {
          id: review.product_id,
          name: review.product_name,
          image: review.product_image,
        },
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
      reviews = await this.db
        .table('reviews')
        .where('product_id', productId)
        .where('status', ReviewStatus.APPROVED)
        .orderBy('created_at', 'desc')
        .select(
          'reviews.id',
          'reviews.rating',
          'reviews.title',
          'reviews.content',
          'reviews.created_at',
          'users.id as user_id',
          'users.name as user_name',
        )
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableReviewPayload()
      }
      throw error
    }

    const reviewCount = reviews.length
    const averageRating =
      reviewCount > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviewCount
            ).toFixed(1),
          )
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
        id: review.id,
        rating: review.rating,
        title: review.title ? this.sanitizeHtml(review.title as string) : null,
        content: this.sanitizeHtml(review.content as string),
        user: { id: review.user_id, name: review.user_name },
        comments: [],
      })),
    }

    await this.cache.setJson(cacheKey, result, 300)
    return result
  }

  async getReviewEligibility(userId: number, productId: number) {
    await this.ensureProductExists(productId)

    try {
      const [existingReview, qualifyingOrder] = await Promise.all([
        this.db
          .table('reviews')
          .where('user_id', userId)
          .andWhere('product_id', productId)
          .select('id')
          .first(),
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
          reason:
            'Reviews will be available after the database update is applied.',
        }
      }
      throw error
    }
  }

  async createReview(
    userId: number,
    productId: number,
    dto: Record<string, unknown>,
  ) {
    await this.ensureProductExists(productId)
    const content = String(dto.content).trim()
    const title =
      dto.title !== undefined ? String(dto.title).trim() || null : null

    if (!content) {
      throw new BadRequestException('Review content cannot be empty.')
    }

    let existingReview: { id: number } | null
    let qualifyingOrder: { id: number } | null

    try {
      ;[existingReview, qualifyingOrder] = await Promise.all([
        this.db
          .table('reviews')
          .where('user_id', userId)
          .andWhere('product_id', productId)
          .select('id')
          .first(),
        this.getEligibleDeliveredOrder(userId, productId),
      ])
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Reviews are not available yet. Apply the latest database migration and try again.',
        )
      }
      throw error
    }

    if (existingReview) {
      throw new ConflictException('You already reviewed this product.')
    }

    if (!qualifyingOrder) {
      throw new BadRequestException(
        'You can only review products you have purchased.',
      )
    }

    try {
      const reviewId = await this.db.table('reviews').insert({
        user_id: userId,
        product_id: productId,
        order_id: qualifyingOrder.id,
        rating: Number(dto.rating),
        title,
        content,
        status: ReviewStatus.PENDING,
      })

      const [review] = await this.db
        .table('reviews')
        .where('id', reviewId[0])
        .select(
          'id',
          'title',
          'content',
          'rating',
          'status',
          'created_at',
        )
        .first()

      const user = await this.db
        .table('users')
        .where('id', userId)
        .select('email', 'name')
        .first()

      if (user?.email) {
        await this.emailVerificationService.sendReviewPosted(
          user.email,
          user.name,
          userId,
        )
      }

      await this.cache.del(`reviews:product:${productId}`)
      await this.cache.del('reviews:featured:6')

      return {
        ...review,
        title: review.title ? this.sanitizeHtml(review.title as string) : null,
        content: this.sanitizeHtml(review.content as string),
      }
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Reviews are not available yet. Apply the latest database migration and try again.',
        )
      }
      throw error
    }
  }

  async moderateReview(
    reviewId: number,
    dto: Record<string, unknown>,
  ): Promise<{ id: number; status: ReviewStatus; adminNote: string | null }> {
    const review = await this.db
      .table('reviews')
      .where('id', reviewId)
      .select('id', 'status', 'admin_note', 'product_id')
      .first()

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    await this.db.table('reviews').where('id', reviewId).update({
      status: dto.status === 'APPROVED' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED,
      admin_note: dto.adminNote ?? null,
    })

    const updatedReview = await this.db
      .table('reviews')
      .where('id', reviewId)
      .select('id', 'status', 'admin_note')
      .first()

    await this.cache.del(`reviews:product:${review.product_id}`)
    await this.cache.del('reviews:featured:6')

    return {
      id: updatedReview.id,
      status: updatedReview.status,
      adminNote: updatedReview.admin_note,
    }
  }

  async getPendingReviews(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      this.db
        .table('reviews')
        .where('status', ReviewStatus.PENDING)
        .orderBy('created_at', 'asc')
        .offset(skip)
        .limit(limit)
        .select(
          'reviews.id',
          'reviews.rating',
          'reviews.title',
          'reviews.content',
          'reviews.status',
          'reviews.created_at',
          'users.id as user_id',
          'users.name as user_name',
          'products.id as product_id',
          'products.name as product_name',
          'products.image as product_image',
        ),
      this.db
        .table('reviews')
        .where('status', ReviewStatus.PENDING)
        .count('id as total'),
    ])

    return {
      data: reviews,
      meta: {
        total: total[0].total,
        page,
        limit,
        totalPages: Math.ceil(total[0].total / limit),
      },
    }
  }

  async createComment(
    userId: number,
    reviewId: number,
    dto: Record<string, unknown>,
  ) {
    const content = String(dto.content).trim()

    if (!content) {
      throw new BadRequestException('Comment content cannot be empty.')
    }

    let review: { id: number; productId: number } | null

    try {
      review = await this.db
        .table('reviews')
        .where('id', reviewId)
        .select('id', 'product_id')
        .first()
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Review comments are not available yet. Apply the latest database migration and try again.',
        )
      }
      throw error
    }

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    try {
      const commentId = await this.db.table('review_comments').insert({
        review_id: reviewId,
        user_id: userId,
        content,
      })

      const [comment] = await this.db
        .table('review_comments')
        .where('id', commentId[0])
        .select('id', 'content', 'created_at')
        .first()

      const user = await this.db
        .table('users')
        .where('id', userId)
        .select('email', 'name')
        .first()

      if (user?.email) {
        await this.emailVerificationService.sendCommentPosted(
          user.email,
          user.name,
          userId,
        )
      }

      await this.cache.del(`reviews:product:${review.productId}`)

      return {
        id: comment.id,
        content: this.sanitizeHtml(comment.content),
      }
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Review comments are not available yet. Apply the latest database migration and try again.',
        )
      }
      throw error
    }
  }
}
