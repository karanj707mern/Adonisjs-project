import { inject } from '@adonisjs/fold'
import type { PrismaClient, OrderStatus } from '@prisma/client'
import { Role } from '@prisma/client'

import AuditService from '#controllers/audit/audit_service'

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isEmailVerified: true,
  authProvider: true,
  phoneNumber: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
  updatedAt: true,
} as const

export interface RecentOrder {
  id: number
  orderNumber: string
  orderTitle: string
  status: OrderStatus
  total: number
  createdAt: Date
  user: {
    id: number
    name: string
    email: string
  }
}

export interface RecentIssue {
  id: number
  title: string
  status: string
  type: string
  description: string
  createdAt: Date
  order: {
    id: number
    orderNumber: string
    orderTitle: string
  }
}

export interface AdminOverview {
  productCount: number
  openOrderCount: number
  cancelledOrderCount: number
  issueCount: number
  blogCount: number
  codCollected: number
  onlineCollected: number
  recentOrders: RecentOrder[]
  recentIssues: RecentIssue[]
}

export default class AdminService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject() private auditService: AuditService
  ) {}

  async getOverview(): Promise<AdminOverview> {
    const [
      productCount,
      openOrderCount,
      cancelledOrderCount,
      issueCount,
      blogCount,
      codCollected,
      onlineCollected,
      recentOrdersRaw,
      recentIssuesRaw,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'PAID', 'SHIPPED', 'OUT_FOR_DELIVERY'] as OrderStatus[],
          },
        },
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: ['CANCELLED'] as OrderStatus[],
          },
        },
      }),
      this.prisma.orderActivity.count({
        where: { title: 'Order issue' },
      }),
      this.prisma.blogPost.count(),
      this.prisma.order.aggregate({
        where: {
          paymentMethod: 'cod',
          status: {
            in: ['PAID', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          paymentMethod: { not: 'cod' },
          status: {
            in: ['PAID', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: {
          user: { role: 'USER' as Role },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.orderActivity.findMany({
        where: { title: 'Order issue' },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              items: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const codTotal = codCollected._sum.total ?? 0
    const onlineTotal = onlineCollected._sum.total ?? 0

    const recentOrders: RecentOrder[] = recentOrdersRaw
      .filter(
        (
          order
        ): order is PrismaClient & {
          id: number
          items: { product: { name: string | null } | null }[]
          user: { id: number; name: string; email: string }
          status: OrderStatus
          total: number
          createdAt: Date
        } => order !== null
      )
      .map((order) => {
        const items = order.items
        const [firstItem, ...restItems] = items
        const orderTitle = restItems.length
          ? `${firstItem?.product?.name || 'Moringa item'} + ${restItems.length} more item${restItems.length > 1 ? 's' : ''}`
          : firstItem?.product?.name || 'Moringa order'

        return {
          id: order.id,
          orderNumber: `MOR-${String(10000000 + order.id)}`,
          orderTitle,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          user: order.user,
        }
      })

    const recentIssues: RecentIssue[] = recentIssuesRaw
      .map((activity) => {
        const detail = activity.detail
        if (!detail || !detail.startsWith('__ISSUE__')) return null
        try {
          const issueDetail = JSON.parse(detail.slice('__ISSUE__'.length)) as {
            title: string
            status: string
            type: string
            description: string
          }
          const order = activity.order
          const items = order.items
          const [firstItem, ...restItems] = items
          const orderTitle = restItems.length
            ? `${firstItem?.product?.name || 'Moringa item'} + ${restItems.length} more item${restItems.length > 1 ? 's' : ''}`
            : firstItem?.product?.name || 'Moringa order'

          return {
            id: activity.id,
            title: issueDetail.title,
            status: issueDetail.status,
            type: issueDetail.type,
            description: issueDetail.description,
            createdAt: activity.createdAt,
            order: {
              id: order.id,
              orderNumber: `MOR-${String(10000000 + order.id)}`,
              orderTitle,
            },
          }
        } catch {
          return null
        }
      })
      .filter((issue: RecentIssue | null): issue is RecentIssue => issue !== null)

    return {
      productCount,
      openOrderCount,
      cancelledOrderCount,
      issueCount,
      blogCount,
      codCollected: codTotal,
      onlineCollected: onlineTotal,
      recentOrders,
      recentIssues,
    }
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
    })
  }

  async getUser(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })
  }

  async updateUser(id: number, dto: Record<string, unknown>, adminId: number) {
    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = String(dto.name)
    if (dto.email !== undefined) data.email = String(dto.email).toLowerCase()
    if (dto.phoneNumber !== undefined) data.phoneNumber = String(dto.phoneNumber) || null
    if (dto.role !== undefined) data.role = dto.role as Role
    if (dto.isEmailVerified !== undefined) data.isEmailVerified = Boolean(dto.isEmailVerified)

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { ...safeUserSelect },
    })

    const result = await this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    })

    if (existing && (data.email || data.role)) {
      await this.auditService.logAdminAction(adminId, 'USER_UPDATE', 'User', id, existing, result)
    }

    return result
  }

  async deleteUser(id: number, adminId: number) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })

    await this.prisma.user.delete({ where: { id } })

    if (existing) {
      await this.auditService.logAdminAction(adminId, 'USER_DELETE', 'User', id, existing, null)
    }

    return { message: 'User deleted successfully' }
  }

  async listOrders(status?: OrderStatus) {
    const where = status ? { status } : {}
    return this.prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listPendingProducts() {
    return this.prisma.product.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async approveProduct(id: number, adminId: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    })

    const result = await this.prisma.product.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        price: true,
        stock: true,
        updatedAt: true,
      },
    })

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'PRODUCT_APPROVE',
        'Product',
        id,
        { isActive: existing.isActive },
        { isActive: true }
      )
    }

    return result
  }

  async rejectProduct(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    })

    await this.auditService.logAdminAction(
      adminId,
      'PRODUCT_REJECT',
      'Product',
      id,
      { isActive: existing?.isActive },
      { isActive: false, reason }
    )

    return { message: 'Product rejected', reason }
  }

  async listPendingReviews() {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async approveReview(id: number, adminId: number) {
    const existing = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    const result = await this.prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    })

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_APPROVE',
        'Review',
        id,
        { status: existing.status },
        { status: 'APPROVED' }
      )
    }

    return result
  }

  async rejectReview(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    const result = await this.prisma.review.update({
      where: { id },
      data: { status: 'REJECTED', adminNote: reason ?? null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    })

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_REJECT',
        'Review',
        id,
        { status: existing.status },
        { status: 'REJECTED', reason }
      )
    }

    return result
  }

  async listPendingBlogPosts() {
    return this.prisma.blogPost.findMany({
      where: { published: false },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async publishBlogPost(id: number, adminId: number) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true, published: true },
    })

    const result = await this.prisma.blogPost.update({
      where: { id },
      data: { published: true, publishedAt: new Date() },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_PUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: true }
      )
    }

    return result
  }

  async unpublishBlogPost(id: number, adminId: number) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true, published: true },
    })

    const result = await this.prisma.blogPost.update({
      where: { id },
      data: { published: false },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_UNPUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: false }
      )
    }

    return result
  }
}
