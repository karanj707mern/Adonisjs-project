import type { Router } from '@adonisjs/core/http';
import AuditController from './audit_controller.js';

export default function registerAudit(router: Router) {
  router
    .group(() => {
      router.get('log', [AuditController, 'getAuditLogs']);
      router.get('log/:id', [AuditController, 'getAuditLog']);
    })
    .prefix('Audit');
}
