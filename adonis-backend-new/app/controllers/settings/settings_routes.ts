import type { Router } from '@adonisjs/core/http';
import SettingsController from './settings_controller';

export default function registerSettings(router) {
  router.group(() => {
    router.get('', [SettingsController, 'getStoreSettings']);
    
      router
        .patch('', [SettingsController, 'updateStoreSettings'])
        .middleware('auth')
        .middleware('admin');
  }).prefix('Settings');
}
