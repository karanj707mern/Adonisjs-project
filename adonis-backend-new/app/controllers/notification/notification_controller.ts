import { inject } from '@adonisjs/fold';
import type { HttpContext } from '@adonisjs/core/http';
import NotificationService from './notification_service.js';

@inject()
export default class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getUserNotifications({ request, response, auth }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)));
    const limit = Math.min(
      100,
      Math.max(1, Number(request.input('limit', 20))),
    );
    const result = await this.notificationService.getUserNotifications(
      auth!.user.id,
      page,
      limit,
    );
    return response.json(result);
  }

  async getUnreadCount({ request, auth }: HttpContext) {
    return this.notificationService.getUnreadCount(auth!.user.id);
  }

  async markNotificationAsRead({
    request,
    params,
    response,
    auth,
  }: HttpContext) {
    const notificationId = Number(params.id);
    const result = await this.notificationService.markNotificationAsRead(
      notificationId,
      auth!.user.id,
    );
    return response.json(result);
  }

  async markAllNotificationsAsRead({ request, auth }: HttpContext) {
    return this.notificationService.markAllNotificationsAsRead(auth!.user.id);
  }

  async getUserPreferences({ request, auth }: HttpContext) {
    return this.notificationService.getUserPreferences(auth!.user.id);
  }

  async updateNotificationPreference({ request, auth }: HttpContext) {
    const dto = request.all() as {
      type: string;
      channel: string;
      enabled: boolean;
    };
    return this.notificationService.updateNotificationPreference(
      auth!.user.id,
      dto,
    );
  }

  async findAdminNotifications({ request }: HttpContext) {
    const query = request.all();
    const result = await this.notificationService.findAdminNotifications({
      orderId: query.orderId ? Number(query.orderId) : undefined,
      status: query.status,
      channel: query.channel,
      type: query.type,
      page: Math.max(1, Number(query.page || 1)),
      limit: Math.min(100, Math.max(1, Number(query.limit || 20))),
    });
    return query._isJson ? query : { ...result }; // Adonis auto JSON
  }

  async getHealth() {
    return this.notificationService.getHealth();
  }
}
