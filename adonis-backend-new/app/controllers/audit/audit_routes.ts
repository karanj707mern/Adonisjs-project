import type { Router } from '@adonisjs/core/http';
import AuditController from './audit_controller';

export default function registerAudit(router: Router) {
  router.get('log', [AuditController, 'getAuditLogs']);
  router.get('log/:id', [AuditController, 'getAuditLog']);
}
