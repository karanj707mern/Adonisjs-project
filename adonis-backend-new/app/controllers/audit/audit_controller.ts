import { inject, injectable } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import { NotFoundException } from '@adonisjs/core/http'

import AuditService from './audit_service'

@inject()
@injectable()
export default class AuditController {
  constructor(
    private auditService: AuditService,
  ) {}

  async getAuditLogs({ request }: HttpContext) {
    const query = await request.validateUsing(auditLogQueryValidator)
    return this.auditService.getAuditLogs(query)
  }

  async getAuditLog({ params }: HttpContext) {
    const id = Number(params.id)
    const log = await this.auditService.getAuditLog(id)
    if (!log) {
      throw new NotFoundException('Audit log not found')
    }
    return log
  }
}

import vine from '@vinejs/vine'

export const auditLogQueryValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    action: vine.string().optional(),
    entityType: vine.string().optional(),
    userId: vine.number().min(1).optional(),
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
  }),
)
