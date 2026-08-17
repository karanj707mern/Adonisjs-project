import { inject, injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import type { DatabaseQueryException } from '@adonisjs/lucid/database'
import type { AdminAuditLog } from '#models/admin_audit_log'
import AuditService from '#controllers/audit/audit_service'

export interface RecentOrder {
  id: number
  orderNumber: string
  orderTitle: string
  status: string
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

@injectable()
export default class AdminService {
  constructor(
    private db: Database,
    private auditService: AuditService,
  ) {}

  async getOverview(): Promise<AdminOverview> {
    const [
      productCount,
      openOrderCount,
      cancelledOrderCount,
      issueCount,
      blogCount,
      codTotal,
      onlineTotal,
      recentOrdersRaw,
      recentIssuesRaw,
    ] = await Promise.all([
      this.db.table('products').count('id as total'),
      this.db
        .table('orders')
        .where('status', 'PENDING')
        .orWhere('status', 'PAID')
        .orWhere('status', 'SHIPPED')
        .orWhere('status', 'OUT_FOR_DELIVERY')
        .count('id as total'),
      this.db.table('orders').where('status', 'CANCELLED').count('id as total'),
      this.db
        .table('order_activities')
        .where('title', 'Order issue')
        .count('id as total'),
      this.db.table('blog_posts').count('id as total'),
      this.db
        .table('orders')
        .where((qb) => {
          qb
            .where('payment_method', 'cod')
            .andWhere((q2) => {
              q2
                .where('status', 'PAID')
                .orWhere('status', 'SHIPPED')
                .orWhere('status', 'OUT_FOR_DELIVERY')
                .orWhere('status', 'DELIVERED')
                .orWhere('status', 'CANCELLED')
            })
        })
        .sum('total as total'),
      this.db
        .table('orders')
        .where((qb) => {
          qb
            .where('payment_method', '!=', 'cod')
            .andWhere((q2) => {
              q2
                .where('status', 'PAID')
                .orWhere('status', 'SHIPPED')
                .orWhere('status', 'OUT_FOR_DELIVERY')
                .orWhere('status', 'DELIVERED')
                .orWhere('status', 'CANCELLED')
            })
        })
        .sum('total as total'),
      this.db
        .table('orders')
        .join('users', 'orders.user_id', 'users.id')
        .where('users.role', 'USER')
        .select(
          'orders.id',
          'orders.total',
          'orders.status',
          'orders.created_at',
          'users.id as user_id',
          'users.name as user_name',
          'users.email as user_email',
        )
        .orderBy('orders.created_at', 'desc')
        .limit(5),
      this.db
        .table('order_activities')
        .where('title', 'Order issue')
        .join('orders', 'order_activities.order_id', 'orders.id')
        .join('users', 'orders.user_id', 'users.id')
        .select(
          'order_activities.id',
          'order_activities.title',
          'order_activities.detail',
          'order_activities.created_at',
          'orders.id as order_id',
          'users.id as user_id',
          'users.name as user_name',
          'users.email as user_email',
        )
        .orderBy('order_activities.created_at', 'desc')
        .limit(5),
    ])

    const recentOrders: RecentOrder[] = recentOrdersRaw.map((order: any) => {
      return {
        id: order.id,
        orderNumber: `MOR-${String(10000000 + order.id)}`,
        orderTitle: 'Moringa order',
        status: order.status,
        total: order.total,
        createdAt: order.created_at,
        user: {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
        },
      }
    })

    const recentIssues: RecentIssue[] = recentIssuesRaw
      .map((activity: any) => {
        const detail = activity.detail
        if (!detail || !detail.startsWith('__ISSUE__')) return null
        try {
          const issueDetail = JSON.parse(detail.slice('__ISSUE__'.length)) as {
            title: string
            status: string
            type: string
            description: string
          }

          return {
            id: activity.id,
            title: issueDetail.title,
            status: issueDetail.status,
            type: issueDetail.type,
            description: issueDetail.description,
            createdAt: activity.created_at,
            order: {
              id: activity.order_id,
              orderNumber: `MOR-${String(10000000 + activity.order_id)}`,
              orderTitle: 'Moringa order',
            },
          }
        } catch {
          return null
        }
      })
      .filter(
        (issue: RecentIssue | null): issue is RecentIssue => issue !== null,
      )

    return {
      productCount: (productCount as any)[0]?.total || 0,
      openOrderCount: (openOrderCount as any)[0]?.total || 0,
      cancelledOrderCount: (cancelledOrderCount as any)[0]?.total || 0,
      issueCount: (issueCount as any)[0]?.total || 0,
      blogCount: (blogCount as any)[0]?.total || 0,
      codCollected: Number((codTotal as any).total) || 0,
      onlineCollected: Number((onlineTotal as any).total) || 0,
      recentOrders,
      recentIssues,
    }
  }

  async listUsers() {
    return this.db.table('users').select(safeUserSelect)
  }

  async getUser(id: number) {
    return this.db.table('users').where('id', id).select(safeUserSelect).first()
  }

  async updateUser(id: number, dto: Record<string, unknown>, adminId: number) {
    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = String(dto.name).trim()
    if (dto.email !== undefined)
      data.email = String(dto.email).trim().toLowerCase()
    if (dto.phoneNumber !== undefined)
      data.phoneNumber = String(dto.phoneNumber).trim() || null
    if (dto.role !== undefined) data.role = dto.role as string
    if (dto.isEmailVerified !== undefined)
      data.isEmailVerified = Boolean(dto.isEmailVerified)

    const existing = await this.db
      .table('users')
      .where('id', id)
      .select(...Object.keys(safeUserSelect).map((k) => k as any))
      .first()

    await this.db.table('users').where('id', id).update(data)

    const result = await this.db
      .table('users')
      .where('id', id)
      .select(...Object.keys(safeUserSelect).map((k) => k as any))
      .first()

    if (existing && (data.email || data.role)) {
      await this.auditService.logAdminAction(
        adminId,
        'USER_UPDATE',
        'User',
        id,
        existing,
        result,
      )
    }

    return result
  }

  async deleteUser(id: number, adminId: number) {
    const existing = await this.db.table('users').where('id', id).first()

    await this.db.table('users').where('id', id).delete()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'USER_DELETE',
        'User',
        id,
        existing,
        null,
      )
    }

    return { message: 'User deleted successfully' }
  }

  async listOrders(status?: string) {
    const query = this.db.table('orders').orderBy('created_at', 'desc')
    if (status) {
      query.where('status', status)
    }
    return query.select(
      'orders.id',
      'orders.total',
      'orders.status',
      'orders.created_at',
      'users.id as user_id',
      'users.name as user_name',
      'users.email as user_email',
    )
      .join('users', 'orders.user_id', 'users.id')
  }

  async listPendingProducts() {
    return this.db
      .table('products')
      .where('is_active', false)
      .select(
        'id',
        'name',
        'slug',
        'is_active',
        'created_at',
        'updated_at',
      )
  }

  async approveProduct(id: number, adminId: number) {
    const existing = await this.db
      .table('products')
      .where('id', id)
      .select('id', 'name', 'is_active')
      .first()

    await this.db.table('products').where('id', id).update({ is_active: true })

    const result = await this.db
      .table('products')
      .where('id', id)
      .select(
        'id',
        'name',
        'slug',
        'is_active',
        'price',
        'stock',
        'updated_at',
      )
      .first()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'PRODUCT_APPROVE',
        'Product',
        id,
        { isActive: existing.is_active },
        { isActive: true },
      )
    }

    return result
  }

  async rejectProduct(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.db
      .table('products')
      .where('id', id)
      .select('id', 'name', 'is_active')
      .first()

    await this.auditService.logAdminAction(
      adminId,
      'PRODUCT_REJECT',
      'Product',
      id,
      { isActive: existing?.is_active },
      { isActive: false, reason },
    )

    return { message: 'Product rejected', reason }
  }

  async listPendingReviews() {
    return this.db
      .table('reviews')
      .where('status', 'PENDING')
      .orderBy('created_at', 'desc')
      .select(
        'reviews.id',
        'reviews.rating',
        'reviews.title',
        'reviews.content',
        'reviews.status',
        'reviews.created_at',
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
        'products.id as product_id',
        'products.name as product_name',
      )
      .join('users', 'reviews.user_id', 'users.id')
      .join('products', 'reviews.product_id', 'products.id')
  }

  async approveReview(id: number, adminId: number) {
    const existing = await this.db
      .table('reviews')
      .where('id', id)
      .select('id', 'status')
      .first()

    await this.db.table('reviews').where('id', id).update({ status: 'APPROVED' })

    const result = await this.db
      .table('reviews')
      .where('id', id)
      .select(
        'reviews.id',
        'reviews.status',
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
        'products.id as product_id',
        'products.name as product_name',
      )
      .join('users', 'reviews.user_id', 'users.id')
      .join('products', 'reviews.product_id', 'products.id')
      .first()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_APPROVE',
        'Review',
        id,
        { status: existing.status },
        { status: 'APPROVED' },
      )
    }

    return result
  }

  async rejectReview(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.db
      .table('reviews')
      .where('id', id)
      .select('id', 'status')
      .first()

    await this.db.table('reviews').where('id', id).update({
      status: 'REJECTED',
      admin_note: reason ?? null,
    })

    const result = await this.db
      .table('reviews')
      .where('id', id)
      .select(
        'reviews.id',
        'reviews.status',
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
        'products.id as product_id',
        'products.name as product_name',
      )
      .join('users', 'reviews.user_id', 'users.id')
      .join('products', 'reviews.product_id', 'products.id')
      .first()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_REJECT',
        'Review',
        id,
        { status: existing.status },
        { status: 'REJECTED', reason },
      )
    }

    return result
  }

  async listPendingBlogPosts() {
    return this.db
      .table('blog_posts')
      .where('published', false)
      .select(
        'id',
        'title',
        'slug',
        'published',
        'created_at',
        'updated_at',
      )
  }

  async publishBlogPost(id: number, adminId: number) {
    const existing = await this.db
      .table('blog_posts')
      .where('id', id)
      .select('id', 'title', 'published')
      .first()

    await this.db.table('blog_posts').where('id', id).update({
      published: true,
      published_at: new Date(),
    })

    const result = await this.db
      .table('blog_posts')
      .where('id', id)
      .select(
        'id',
        'title',
        'slug',
        'published',
        'published_at',
        'updated_at',
      )
      .first()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_PUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: true },
      )
    }

    return result
  }

  async unpublishBlogPost(id: number, adminId: number) {
    const existing = await this.db
      .table('blog_posts')
      .where('id', id)
      .select('id', 'title', 'published')
      .first()

    await this.db.table('blog_posts').where('id', id).update({ published: false })

    const result = await this.db
      .table('blog_posts')
      .where('id', id)
      .select(
        'id',
        'title',
        'slug',
        'published',
        'published_at',
        'updated_at',
      )
      .first()

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_UNPUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: false },
      )
    }

    return result
  }
}
