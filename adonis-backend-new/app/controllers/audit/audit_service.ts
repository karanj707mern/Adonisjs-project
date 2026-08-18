import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';

export interface AuditLogWithUser {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export default class AuditService {
  constructor(private prisma: PrismaClient) {}

  async getAuditLogs(query: AuditLogQuery): Promise<{
    data: AuditLogWithUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate);
      }
      where.createdAt = createdAt;
    }

    const [data, countResult] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    const logs: AuditLogWithUser[] = data.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      },
    }));

    return { data: logs, total: countResult, page, limit };
  }

  async getAuditLog(id: number): Promise<AuditLogWithUser | null> {
    const log = await this.prisma.adminAuditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!log) return null;

    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      },
    };
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
    await this.prisma.adminAuditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId ?? undefined,
        oldValue:
          oldValue !== undefined && oldValue !== null
            ? JSON.stringify(oldValue)
            : null,
        newValue:
          newValue !== undefined && newValue !== null
            ? JSON.stringify(newValue)
            : null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }
}
