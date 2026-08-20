import type { Router } from '@adonisjs/core/http';
import HealthController from './health_controller';

export default function registerHealth(router) {
  router.group(() => {
    router.get('health', [HealthController, 'check']);
      router.get('health/ready', [HealthController, 'ready']);
      router.get('health/live', [HealthController, 'live']);
  }).prefix('health');
}
