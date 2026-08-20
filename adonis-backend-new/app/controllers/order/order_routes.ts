import type { Router } from '@adonisjs/core/http';
import OrderController from './order_controller';

export default function registerOrder(router) {
  router
    .group(() => {
      router.post('order/webhook/razorpay', [
        OrderController,
        'handleRazorpayWebhook',
      ]);
      router
        .post('order/verify-payment', [OrderController, 'verifyPayment'])
        .middleware('auth');
      router
        .post('order/checkout-session', [
          OrderController,
          'createCheckoutSession',
        ])
        .middleware('auth');
      router
        .post('order/preview', [OrderController, 'preview'])
        .middleware('auth');
      router.post('order', [OrderController, 'create']).middleware('auth');

      router.get('order', [OrderController, 'findMyOrders']).middleware('auth');

      router
        .get('order/admin', [OrderController, 'findAdminOrders'])
        .middleware(['auth', 'admin']);
      router
        .get('order/admin/open', [OrderController, 'findOpenOrders'])
        .middleware(['auth', 'admin']);
      router
        .get('order/admin/cancelled', [OrderController, 'findCancelledOrders'])
        .middleware(['auth', 'admin']);
      router
        .get('order/admin/issues', [OrderController, 'findAdminIssues'])
        .middleware(['auth', 'admin']);

      router.get('order/:id', [OrderController, 'findOne']).middleware('auth');
      router
        .get('order/:id/invoice', [OrderController, 'getInvoice'])
        .middleware('auth');

      router
        .post('order/:id/issues', [OrderController, 'createIssue'])
        .middleware('auth');
      router
        .patch('order/:id', [OrderController, 'update'])
        .middleware(['auth', 'admin']);
      router
        .patch('order/issues/:issueId', [OrderController, 'updateIssue'])
        .middleware(['auth', 'admin']);
      router
        .post('order/admin/:id/refund', [OrderController, 'refundOrder'])
        .middleware(['auth', 'admin']);
      router
        .delete('order/:id', [OrderController, 'remove'])
        .middleware('auth');

      router
        .get('order/:id/track', [OrderController, 'track'])
        .middleware('auth');
    })
    .prefix('Order');
}
