import type { HttpContext } from '@adonisjs/core/http';
import type { Router } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import NotificationController from './notification_controller.js';
import { middleware } from '#start/kernel';

export default function registerNotification(router: Router) {
  router
    .group(() => {
      router
        .group(() => {
          router.get('', [NotificationController, 'getUserNotifications']);
          router.get('unread-count', [
            NotificationController,
            'getUnreadCount',
          ]);
          router.patch(':id/read', [
            NotificationController,
            'markNotificationAsRead',
          ]);
          router.patch('read-all', [
            NotificationController,
            'markAllNotificationsAsRead',
          ]);
          router.get('preferences', [
            NotificationController,
            'getUserPreferences',
          ]);
          router.patch('preferences', [
            NotificationController,
            'updateNotificationPreference',
          ]);
        })
        .middleware(middleware.auth());

      router
        .group(() => {
          router.get('admin', [
            NotificationController,
            'findAdminNotifications',
          ]);
          router.get('admin/health', [NotificationController, 'getHealth']);
        })
        .middleware(middleware.auth())
        .middleware(middleware.admin());
    })
    .prefix('Notification');
}
