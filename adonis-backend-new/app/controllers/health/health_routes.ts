import type { Router } from '@adonisjs/core/http';
import HealthController from './health_controller.js';

export default function registerHealth(router: Router) {
  router
    .group(() => {
      router.get('/', [HealthController, 'check']);
      router.get('/ready', [HealthController, 'ready']);
      router.get('/live', [HealthController, 'live']);
    })
    .prefix('health');
}
