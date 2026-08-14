import ReviewController from './review_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerReview(router: Router) {
  router.get('featured', [ReviewController, 'getFeaturedReviews'])

  router.get('product/:productId', [ReviewController, 'getProductReviews'])

  router
    .get('product/:productId/eligibility', [ReviewController, 'getReviewEligibility'])
    .middleware(middleware.auth())

  router.post('product/:productId', [ReviewController, 'createReview']).middleware(middleware.auth())

  router.post(':reviewId/comments', [ReviewController, 'createComment']).middleware(middleware.auth())

  router
    .patch(':id/moderate', [ReviewController, 'moderateReview'])
    .middleware(middleware.auth())
    .middleware(middleware.admin())

  router
    .get('pending', [ReviewController, 'getPendingReviews'])
    .middleware(middleware.auth())
    .middleware(middleware.admin())
}
