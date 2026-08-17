import { inject, injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'

export interface AuditLogWithUser {
  id: number
  userId: number
  action: string
  entityType: string
  entityId: number | null
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: {
    id: number
    name: string
    email: string
  }
}

export interface AuditLogQuery {
  page: number
  limit: number
  action?: string
  entityType?: string
  userId?: number
  startDate?: string
  endDate?: string
}

@injectable()
export default class AuditService {
  constructor(private db: Database) {}

  async getAuditLogs(query: AuditLogQuery): Promise<{
    data: AuditLogWithUser[]
    total: number
    page: number
    limit: number
  }> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (query.action) {
      where.action = query.action
    }

    if (query.entityType) {
      where.entityType = query.entityType
    }

    if (query.userId) {
      where.userId = query.userId
    }

    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {}
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate)
      }
      where.createdAt = createdAt
    }

    const [data, countResult] = await Promise.all([
      this.db
        .table('admin_audit_logs')
        .where(where)
        .join('users', 'admin_audit_logs.user_id', 'users.id')
        .select(
          'admin_audit_logs.id',
          'admin_audit_logs.user_id',
          'admin_audit_logs.action',
          'admin_audit_logs.entity_type',
          'admin_audit_logs.entity_id',
          'admin_audit_logs.old_value',
          'admin_audit_logs.new_value',
          'admin_audit_logs.ip_address',
          'admin_audit_logs.user_agent',
          'admin_audit_logs.created_at',
          'users.id as user_id',
          'users.name as user_name',
          'users.email as user_email',
        )
        .orderBy('admin_audit_logs.created_at', 'desc')
        .offset(skip)
        .limit(limit),
      this.db.table('admin_audit_logs').where(where).count('id as total'),
    ])

    const total = (countResult[0] as any).total || 0

    const logs: AuditLogWithUser[] = data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      },
    }))

    return { data: logs, total, page, limit }
  }

  async getAuditLog(id: number): Promise<AuditLogWithUser | null> {
    const row = await this.db
      .table('admin_audit_logs')
      .where('admin_audit_logs.id', id)
      .join('users', 'admin_audit_logs.user_id', 'users.id')
      .select(
        'admin_audit_logs.id',
        'admin_audit_logs.user_id',
        'admin_audit_logs.action',
        'admin_audit_logs.entity_type',
        'admin_audit_logs.entity_id',
        'admin_audit_logs.old_value',
        'admin_audit_logs.new_value',
        'admin_audit_logs.ip_address',
        'admin_audit_logs.user_agent',
        'admin_audit_logs.created_at',
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
      )
      .first()

    if (!row) return null

    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      },
    }
  }

  async logAdminAction(
    userId: number,
    action: string,
    entityType: string,
    entityId: number | null,
    oldValue: unknown,
    newValue: unknown,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    await this.db.table('admin_audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value:
        oldValue !== undefined && oldValue !== null
          ? JSON.stringify(oldValue)
          : null,
      new_value:
        newValue !== undefined && newValue !== null
          ? JSON.stringify(newValue)
          : null,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    })
  }
}
