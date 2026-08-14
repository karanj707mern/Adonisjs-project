import NotificationController from './notification_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerNotification(router: Router) {
  router
    .group(() => {
      router.get('', [NotificationController, 'getUserNotifications'])
      router.get('unread-count', [NotificationController, 'getUnreadCount'])
      router.patch(':id/read', [NotificationController, 'markNotificationAsRead'])
      router.patch('read-all', [NotificationController, 'markAllNotificationsAsRead'])
      router.get('preferences', [NotificationController, 'getUserPreferences'])
      router.patch('preferences', [NotificationController, 'updateNotificationPreference'])
    })
    .prefix('notifications')
    .middleware(middleware.auth())

  router
    .group(() => {
      router.get('admin', [NotificationController, 'findAdminNotifications'])
      router.get('admin/health', [NotificationController, 'getHealth'])
    })
    .prefix('notifications')
    .middleware(middleware.auth())
    .middleware(middleware.admin())
}
