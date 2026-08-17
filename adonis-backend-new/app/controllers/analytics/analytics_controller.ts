import { inject, injectable } from '@adonisjs/fold';
import type { HttpContext } from '@adonisjs/core/http';

import AnalyticsService from './analytics_service';

@inject()
@injectable()
export default class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  async getSalesStats({ request }: HttpContext) {
    const dto = await request.validateUsing(salesStatsQueryValidator);
    return this.analyticsService.getSalesStats(dto);
  }

  async getOrdersOverview() {
    return this.analyticsService.getOrdersOverview();
  }

  async getRecoverableCarts({ auth }: HttpContext) {
    const userId = (auth!.user as { id: number }).id;
    return this.analyticsService.getRecoverableCarts(userId);
  }

  async runAbandonedCartSweep() {
    return this.analyticsService.runAbandonedCartSweep();
  }

  async recordView({ auth, request }: HttpContext) {
    const userId = (auth!.user as { id: number }).id;
    const productId = Number(request.input('productId'));
    return this.analyticsService.recordView(userId, productId);
  }

  async getRecentlyViewed({ auth, request }: HttpContext) {
    const userId = (auth!.user as { id: number }).id;
    const limit = Number(request.input('limit', 20));
    return this.analyticsService.getRecentlyViewed(userId, limit);
  }

  async clearHistory({ auth }: HttpContext) {
    const userId = (auth!.user as { id: number }).id;
    return this.analyticsService.clearHistory(userId);
  }
}

import {
  salesStatsQueryValidator,
  recentlyViewedQueryValidator,
} from './analytics_validators';
