import HealthController from './health_controller.ts'
import type { Router } from '@adonisjs/core/http'

export default function registerHealth(router: Router) {
  router.get('health', [HealthController, 'check'])
  router.get('health/ready', [HealthController, 'ready'])
  router.get('health/live', [HealthController, 'live'])
}
