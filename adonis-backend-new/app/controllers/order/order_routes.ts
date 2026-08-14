import OrderController from './order_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerOrder(router: Router) {
  router.post('order/webhook/razorpay', [OrderController, 'handleRazorpayWebhook'])
  router.post('order/verify-payment', [OrderController, 'verifyPayment']).middleware(middleware.auth())
  router
    .post('order/checkout-session', [OrderController, 'createCheckoutSession'])
    .middleware(middleware.auth())
  router.post('order/preview', [OrderController, 'preview']).middleware(middleware.auth())
  router.post('order', [OrderController, 'create']).middleware(middleware.auth())

  router.get('order', [OrderController, 'findMyOrders']).middleware(middleware.auth())

  router.get('order/admin', [OrderController, 'findAdminOrders']).middleware(middleware.auth()).middleware(middleware.admin())
  router.get('order/admin/open', [OrderController, 'findOpenOrders']).middleware(middleware.auth()).middleware(middleware.admin())
  router
    .get('order/admin/cancelled', [OrderController, 'findCancelledOrders'])
    .middleware(middleware.auth()).middleware(middleware.admin())
  router
    .get('order/admin/issues', [OrderController, 'findAdminIssues'])
    .middleware(middleware.auth()).middleware(middleware.admin())

  router.get('order/:id', [OrderController, 'findOne']).middleware(middleware.auth())
  router.get('order/:id/invoice', [OrderController, 'getInvoice']).middleware(middleware.auth())

  router.post('order/:id/issues', [OrderController, 'createIssue']).middleware(middleware.auth())
  router.patch('order/:id', [OrderController, 'update']).middleware(middleware.auth()).middleware(middleware.admin())
  router
    .patch('order/issues/:issueId', [OrderController, 'updateIssue'])
    .middleware(middleware.auth()).middleware(middleware.admin())
  router
    .post('order/admin/:id/refund', [OrderController, 'refundOrder'])
    .middleware(middleware.auth()).middleware(middleware.admin())
  router.delete('order/:id', [OrderController, 'remove']).middleware(middleware.auth())

  router.get('order/:id/track', [OrderController, 'track']).middleware(middleware.auth())
}
