import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import NotificationService from './notification_service'

@inject()
export default class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getUserNotifications({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(100, Math.max(1, Number(request.input('limit', 20))))
    const result = await this.notificationService.getUserNotifications(request.auth.user.id, page, limit)
    return response.json(result)
  }

  async getUnreadCount({ request }: HttpContext) {
    return this.notificationService.getUnreadCount(request.auth.user.id)
  }

  async markNotificationAsRead({ request, params, response }: HttpContext) {
    const notificationId = Number(params.id)
    const result = await this.notificationService.markNotificationAsRead(notificationId, request.auth.user.id)
    return response.json(result)
  }

  async markAllNotificationsAsRead({ request }: HttpContext) {
    return this.notificationService.markAllNotificationsAsRead(request.auth.user.id)
  }

  async getUserPreferences({ request }: HttpContext) {
    return this.notificationService.getUserPreferences(request.auth.user.id)
  }

  async updateNotificationPreference({ request }: HttpContext) {
    const dto = request.all()
    return this.notificationService.updateNotificationPreference(request.auth.user.id, dto)
  }

  async findAdminNotifications({ request }: HttpContext) {
    const query = request.all()
    const result = await this.notificationService.findAdminNotifications({
      orderId: query.orderId ? Number(query.orderId) : undefined,
      status: query.status,
      channel: query.channel,
      type: query.type,
      page: Math.max(1, Number(query.page || 1)),
      limit: Math.min(100, Math.max(1, Number(query.limit || 20))),
    })
    return query._isJson ? query : { ...result } // Adonis auto JSON
  }

  async getHealth() {
    return this.notificationService.getHealth()
  }
}
