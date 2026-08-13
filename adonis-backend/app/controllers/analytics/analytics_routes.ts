import type { Router } from '@adonisjs/core/http'
import AnalyticsController from './analytics_controller'

export default function registerAnalytics(router: Router) {
  router.group(() => {
    router.get('sales/stats', [AnalyticsController, 'getSalesStats'])
    router.get('orders/overview', [AnalyticsController, 'getOrdersOverview'])
    router.get('abandoned-carts/recoverable', [AnalyticsController, 'getRecoverableCarts'])
    router.post('abandoned-carts/sweep', [AnalyticsController, 'runAbandonedCartSweep'])
  }).middleware('admin')

  router.group(() => {
    router.post('viewed', [AnalyticsController, 'recordView'])
    router.get('viewed', [AnalyticsController, 'getRecentlyViewed'])
    router.delete('viewed', [AnalyticsController, 'clearHistory'])
  }).middleware('auth')
}
