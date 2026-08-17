import { inject, injectable } from '@adonisjs/fold';
import type { HttpContext } from '@adonisjs/core/http';

import AuditService from '#controllers/audit/audit_service';

export interface AuditOptions {
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValue?: unknown;
  newValue?: unknown;
}

@injectable()
export default class Audit {
  constructor(
    private auditService: AuditService,
  ) {}

  async log(ctx: HttpContext, options: AuditOptions): Promise<void> {
    const userId = (ctx.auth as { user?: { id: number } } | undefined)?.user
      ?.id;
    if (!userId) {
      return;
    }

    const ipAddress = ctx.request.ip();
    const userAgent = ctx.request.header('user-agent');

    await this.auditService.logAdminAction(
      userId,
      options.action,
      options.entityType,
      options.entityId ?? null,
      options.oldValue ?? null,
      options.newValue ?? null,
      ipAddress,
      userAgent,
    );
  }
}
