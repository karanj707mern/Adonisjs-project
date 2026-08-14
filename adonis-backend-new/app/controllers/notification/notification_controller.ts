import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import { NotificationChannel, NotificationType } from '@prisma/client'
import NotificationService from './notification_service.ts'

@inject()
export default class NotificationController {
  constructor(@inject() private notificationService: NotificationService) {}

  async getUserNotifications({ auth, request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(100, Math.max(1, Number(request.input('limit', 20))))
    const result = await this.notificationService.getUserNotifications(
      auth!.user.id,
      page,
      limit
    )
    return response.json(result)
  }

  async getUnreadCount({ auth }: HttpContext) {
    return this.notificationService.getUnreadCount(auth!.user.id)
  }

  async markNotificationAsRead({ auth, params, response }: HttpContext) {
    const notificationId = Number(params.id)
    const result = await this.notificationService.markNotificationAsRead(
      notificationId,
      auth!.user.id
    )
    return response.json(result)
  }

  async markAllNotificationsAsRead({ auth }: HttpContext) {
    return this.notificationService.markAllNotificationsAsRead(auth!.user.id)
  }

  async getUserPreferences({ auth }: HttpContext) {
    return this.notificationService.getUserPreferences(auth!.user.id)
  }

  async updateNotificationPreference({ auth, request }: HttpContext) {
    const dto = request.all()
    return this.notificationService.updateNotificationPreference(auth!.user.id, {
      type: dto.type as NotificationType,
      channel: dto.channel as NotificationChannel,
      enabled: Boolean(dto.enabled),
    })
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
    return { ...result }
  }

  async getHealth() {
    return this.notificationService.getHealth()
  }
}
