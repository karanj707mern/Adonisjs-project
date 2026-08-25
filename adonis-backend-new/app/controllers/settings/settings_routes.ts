import type { Router } from '@adonisjs/core/http';
import SettingsController from './settings_controller.js';
import { middleware } from '#start/kernel';

export default function registerSettings(router: Router) {
  router
    .group(() => {
      router.get('', [SettingsController, 'getStoreSettings']);

      router
        .patch('', [SettingsController, 'updateStoreSettings'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());
    })
    .prefix('Settings');
}
