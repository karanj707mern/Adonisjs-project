import type { Router } from '@adonisjs/core/http';
import ReviewController from './review_controller';

export default function registerReview(router) {
  router
    .group(() => {
      router.get('featured', [ReviewController, 'getFeaturedReviews']);

      router.get('product/:productId', [ReviewController, 'getProductReviews']);

      router
        .get('product/:productId/eligibility', [
          ReviewController,
          'getReviewEligibility',
        ])
        .middleware('auth');

      router
        .post('product/:productId', [ReviewController, 'createReview'])
        .middleware('auth');

      router
        .post(':reviewId/comments', [ReviewController, 'createComment'])
        .middleware('auth');

      router
        .patch(':id/moderate', [ReviewController, 'moderateReview'])
        .middleware('auth')
        .middleware('admin');

      router
        .get('pending', [ReviewController, 'getPendingReviews'])
        .middleware('auth')
        .middleware('admin');
    })
    .prefix('Review');
}
