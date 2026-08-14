import AuditController from './audit_controller.ts'
import type { Router } from '@adonisjs/core/http'

export default function registerAudit(router: Router) {
  router.get('log', [AuditController, 'getAuditLogs'])
  router.get('log/:id', [AuditController, 'getAuditLog'])
}
