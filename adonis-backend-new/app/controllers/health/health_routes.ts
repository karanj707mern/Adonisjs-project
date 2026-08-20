import type { Router } from '@adonisjs/core/http';
import HealthController from './health_controller';

export default function registerHealth(router) {
  console.log('[DEBUG] registerHealth called');
  try {
    const group = router.group(() => {
      console.log('[DEBUG] Registering health routes');
      router.get('/', [HealthController, 'check']);
      router.get('/ready', [HealthController, 'ready']);
      router.get('/live', [HealthController, 'live']);
    });
    console.log('[DEBUG] Group created:', group);
    const prefixed = group.prefix('health');
    console.log('[DEBUG] Group prefixed:', prefixed);
    console.log('[DEBUG] Health routes registered');
  } catch (error) {
    console.error('[DEBUG] Error registering health routes:', error);
  }
}
