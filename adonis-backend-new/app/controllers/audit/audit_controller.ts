import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import AuditService, { type AuditLogQuery } from './audit_service.ts'
import vine from '@vinejs/vine'

export const auditLogQueryValidator = vine.create(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    action: vine.string().optional(),
    entityType: vine.string().optional(),
    userId: vine.number().min(1).optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
  })
)

@inject()
export default class AuditController {
  constructor(
    @inject() private auditService: AuditService
  ) {}

  async getAuditLogs({ request }: HttpContext) {
    const dto = await request.validateUsing(auditLogQueryValidator)
    const query = { ...dto, page: dto.page ?? 1 } as AuditLogQuery
    return this.auditService.getAuditLogs(query)
  }

  async getAuditLog({ params }: HttpContext) {
    const id = Number(params.id)
    const log = await this.auditService.getAuditLog(id)
    if (!log) {
      throw { status: 404, message: 'Audit log not found' }
    }
    return log
  }
}
