import type { Router } from '@adonisjs/core/http';
import CouponController from './coupon_controller';

export default function registerCoupon(router) {
  router
    .group(() => {
      router.post('validate', [CouponController, 'validate']);

      router
        .get('', [CouponController, 'findAll'])
        .middleware('auth')
        .middleware('admin');

      router
        .get('analytics', [CouponController, 'getAnalytics'])
        .middleware('auth')
        .middleware('admin');

      router
        .post('', [CouponController, 'create'])
        .middleware('auth')
        .middleware('admin');

      router
        .patch(':id', [CouponController, 'update'])
        .middleware('auth')
        .middleware('admin');

      router
        .delete(':id', [CouponController, 'remove'])
        .middleware('auth')
        .middleware('admin');
    })
    .prefix('Coupon');
}
