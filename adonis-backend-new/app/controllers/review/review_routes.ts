import type { Router } from '@adonisjs/core/http';
import ReviewController from './review_controller.js';
import { middleware } from '#start/kernel';

export default function registerReview(router: Router) {
  router
    .group(() => {
      router.get('featured', [ReviewController, 'getFeaturedReviews']);

      router.get('product/:productId', [ReviewController, 'getProductReviews']);

      router
        .get('product/:productId/eligibility', [
          ReviewController,
          'getReviewEligibility',
        ])
        .middleware(middleware.auth());

      router
        .post('product/:productId', [ReviewController, 'createReview'])
        .middleware(middleware.auth());

      router
        .post(':reviewId/comments', [ReviewController, 'createComment'])
        .middleware(middleware.auth());

      router
        .patch(':id/moderate', [ReviewController, 'moderateReview'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .get('pending', [ReviewController, 'getPendingReviews'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());
    })
    .prefix('Review');
}
