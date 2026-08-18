import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import NotificationController from './notification_controller';

export default function registerNotification(router: Router) {
  router
    .group(() => {
      router.get('', [NotificationController, 'getUserNotifications']);
      router.get('unread-count', [NotificationController, 'getUnreadCount']);
      router.patch(':id/read', [
        NotificationController,
        'markNotificationAsRead',
      ]);
      router.patch('read-all', [
        NotificationController,
        'markAllNotificationsAsRead',
      ]);
      router.get('preferences', [NotificationController, 'getUserPreferences']);
      router.patch('preferences', [
        NotificationController,
        'updateNotificationPreference',
      ]);
    })
    .middleware('auth');

  router
    .group(() => {
      router.get('admin', [NotificationController, 'findAdminNotifications']);
      router.get('admin/health', [NotificationController, 'getHealth']);
    })
    .middleware('auth')
    .middleware('admin');
}
