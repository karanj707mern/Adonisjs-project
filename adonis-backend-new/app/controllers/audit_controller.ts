import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class AuditController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAuditLog.count(),
    ])

    return response.json({
      statusCode: 200,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  async show({ params, response }: HttpContext) {
    const log = await this.prisma.adminAuditLog.findUnique({
      where: { id: parseInt(params.id) },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!log) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Audit log not found',
      })
    }

    return response.json({
      statusCode: 200,
      data: log,
    })
  }
}
