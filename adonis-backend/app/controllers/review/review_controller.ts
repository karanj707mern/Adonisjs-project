import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import RedisCacheService from '#services/redis_cache_service'
import ReviewService from './review_service'
import { createReviewValidator, createReviewCommentValidator, moderateReviewValidator } from './review_validators'
import { BadRequestException, ConflictException, NotFoundException } from '@adonisjs/core/http'

@inject()
export default class ReviewController {
  constructor(
    @inject('RedisCache') private cache: RedisCacheService,
    private reviewService: ReviewService,
  ) {}

  async getFeaturedReviews({ response }: HttpContext) {
    const result = await this.reviewService.getFeaturedReviews()
    return response.json(result)
  }

  async getProductReviews({ params, response }: HttpContext) {
    const productId = Number(params.productId)
    const result = await this.reviewService.getProductReviews(productId)
    return response.json(result)
  }

  async getReviewEligibility({ auth, params, response }: HttpContext) {
    const userId = auth.user!.id
    const productId = Number(params.productId)
    const result = await this.reviewService.getReviewEligibility(userId, productId)
    return response.json(result)
  }

  async createReview({ auth, params, request, response }: HttpContext) {
    const userId = auth.user!.id
    const productId = Number(params.productId)
    const data = await request.validateUsing(createReviewValidator)
    const result = await this.reviewService.createReview(userId, productId, data)
    return response.status(201).json(result)
  }

  async createComment({ auth, params, request, response }: HttpContext) {
    const userId = auth.user!.id
    const reviewId = Number(params.reviewId)
    const data = await request.validateUsing(createReviewCommentValidator)
    const result = await this.reviewService.createComment(userId, reviewId, data)
    return response.status(201).json(result)
  }

  async moderateReview({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = await request.validateUsing(moderateReviewValidator)
    const result = await this.reviewService.moderateReview(id, data)
    return response.json(result)
  }

  async getPendingReviews({ request, response }: HttpContext) {
    const page = Number(request.input('page') || 1)
    const limit = Number(request.input('limit') || 10)
    const result = await this.reviewService.getPendingReviews(page, limit)
    return response.json(result)
  }
}
