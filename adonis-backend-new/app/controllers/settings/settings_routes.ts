import SettingsController from './settings_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerSettings(router: Router) {
  router
    .group(() => {
      router.get('', [SettingsController, 'getStoreSettings'])

      router
        .patch('', [SettingsController, 'updateStoreSettings'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())
    })
    .prefix('settings')
}
