import CouponController from './coupon_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerCoupon(router: Router) {
  router
    .group(() => {
      router.post('validate', [CouponController, 'validate'])

      router.get('', [CouponController, 'findAll']).middleware(middleware.auth()).middleware(middleware.admin())

      router
        .get('analytics', [CouponController, 'getAnalytics'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())

      router.post('', [CouponController, 'create']).middleware(middleware.auth()).middleware(middleware.admin())

      router.patch(':id', [CouponController, 'update']).middleware(middleware.auth()).middleware(middleware.admin())

      router.delete(':id', [CouponController, 'remove']).middleware(middleware.auth()).middleware(middleware.admin())
    })
    .prefix('coupons')
}
