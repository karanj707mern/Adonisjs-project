import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';
import AuditService from '#controllers/audit/audit_service';

export interface RecentOrder {
  id: number;
  orderNumber: string;
  orderTitle: string;
  status: string;
  total: number;
  createdAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface RecentIssue {
  id: number;
  title: string;
  status: string;
  type: string;
  description: string;
  createdAt: Date;
  order: {
    id: number;
    orderNumber: string;
    orderTitle: string;
  };
}

export interface AdminOverview {
  productCount: number;
  openOrderCount: number;
  cancelledOrderCount: number;
  issueCount: number;
  blogCount: number;
  codCollected: number;
  onlineCollected: number;
  recentOrders: RecentOrder[];
  recentIssues: RecentIssue[];
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
} as const;

export default class AdminService {
  constructor(
    private prisma: PrismaClient,
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
      this.prisma.product.count(),
      this.prisma.order.count({
        where: {
          status: { in: ['PENDING', 'PAID', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
        },
      }),
      this.prisma.order.count({
        where: { status: 'CANCELLED' },
      }),
      this.prisma.orderActivity.count({
        where: { title: 'Order issue' },
      }),
      this.prisma.blogPost.count(),
      this.prisma.order.aggregate({
        where: {
          paymentMethod: 'cod',
          status: {
            in: [
              'PAID',
              'SHIPPED',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
            ],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          paymentMethod: { not: 'cod' },
          status: {
            in: [
              'PAID',
              'SHIPPED',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
            ],
          },
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { user: { role: 'USER' } },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.orderActivity.findMany({
        where: {
          title: 'Order issue',
          order: {
            user: {
              role: 'USER',
            },
          },
        },
        select: {
          id: true,
          title: true,
          detail: true,
          createdAt: true,
          orderId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const recentOrders: RecentOrder[] = recentOrdersRaw.map((order) => {
      return {
        id: order.id,
        orderNumber: `MOR-${String(10000000 + order.id)}`,
        orderTitle: 'Moringa order',
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        user: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
      };
    });

    const recentIssues: RecentIssue[] = recentIssuesRaw
      .map((activity) => {
        const detail = activity.detail;
        if (!detail || !detail.startsWith('__ISSUE__')) return null;
        try {
          const issueDetail = JSON.parse(detail.slice('__ISSUE__'.length)) as {
            title: string;
            status: string;
            type: string;
            description: string;
          };

          return {
            id: activity.id,
            title: issueDetail.title,
            status: issueDetail.status,
            type: issueDetail.type,
            description: issueDetail.description,
            createdAt: activity.createdAt,
            order: {
              id: activity.orderId,
              orderNumber: `MOR-${String(10000000 + activity.orderId)}`,
              orderTitle: 'Moringa order',
            },
          };
        } catch {
          return null;
        }
      })
      .filter(
        (issue: RecentIssue | null): issue is RecentIssue => issue !== null,
      );

    return {
      productCount,
      openOrderCount,
      cancelledOrderCount,
      issueCount,
      blogCount,
      codCollected: Number(codTotal._sum.total) || 0,
      onlineCollected: Number(onlineTotal._sum.total) || 0,
      recentOrders,
      recentIssues,
    };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
    });
  }

  async getUser(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async updateUser(id: number, dto: Record<string, unknown>, adminId: number) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.email !== undefined)
      data.email = String(dto.email).trim().toLowerCase();
    if (dto.phoneNumber !== undefined)
      data.phoneNumber = String(dto.phoneNumber).trim() || null;
    if (dto.role !== undefined) data.role = dto.role as string;
    if (dto.isEmailVerified !== undefined)
      data.isEmailVerified = Boolean(dto.isEmailVerified);

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    const result = await this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });

    if (existing && (data.email || data.role)) {
      await this.auditService.logAdminAction(
        adminId,
        'USER_UPDATE',
        'User',
        id,
        existing,
        result,
      );
    }

    return result;
  }

  async deleteUser(id: number, adminId: number) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    await this.prisma.user.delete({
      where: { id },
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'USER_DELETE',
        'User',
        id,
        existing,
        null,
      );
    }

    return { message: 'User deleted successfully' };
  }

  async listOrders(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      created_at: order.createdAt,
      user_id: order.user.id,
      user_name: order.user.name,
      user_email: order.user.email,
    }));
  }

  async listPendingProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      is_active: product.isActive,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }));
  }

  async approveProduct(id: number, adminId: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

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
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'PRODUCT_APPROVE',
        'Product',
        id,
        { isActive: existing.isActive },
        { isActive: true },
      );
    }

    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      is_active: result.isActive,
      price: result.price,
      stock: result.stock,
      updated_at: result.updatedAt,
    };
  }

  async rejectProduct(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

    await this.auditService.logAdminAction(
      adminId,
      'PRODUCT_REJECT',
      'Product',
      id,
      { isActive: existing?.isActive },
      { isActive: false, reason },
    );

    return { message: 'Product rejected', reason };
  }

  async listPendingReviews() {
    const reviews = await this.prisma.review.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      status: review.status,
      created_at: review.createdAt,
      user_id: review.user.id,
      user_name: review.user.name,
      user_email: review.user.email,
      product_id: review.product.id,
      product_name: review.product.name,
    }));
  }

  async approveReview(id: number, adminId: number) {
    const existing = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    const result = await this.prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_APPROVE',
        'Review',
        id,
        { status: existing.status },
        { status: 'APPROVED' },
      );
    }

    return {
      id: result.id,
      status: result.status,
      user_id: result.user.id,
      user_name: result.user.name,
      user_email: result.user.email,
      product_id: result.product.id,
      product_name: result.product.name,
    };
  }

  async rejectReview(id: number, reason: string | undefined, adminId: number) {
    const existing = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    const result = await this.prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: reason ?? undefined,
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'REVIEW_REJECT',
        'Review',
        id,
        { status: existing.status },
        { status: 'REJECTED', reason },
      );
    }

    return {
      id: result.id,
      status: result.status,
      user_id: result.user.id,
      user_name: result.user.name,
      user_email: result.user.email,
      product_id: result.product.id,
      product_name: result.product.name,
    };
  }

  async listPendingBlogPosts() {
    const posts = await this.prisma.blogPost.findMany({
      where: { published: false },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      published: post.published,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }));
  }

  async publishBlogPost(id: number, adminId: number) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true, published: true },
    });

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
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_PUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: true },
      );
    }

    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      published: result.published,
      published_at: result.publishedAt,
      updated_at: result.updatedAt,
    };
  }

  async unpublishBlogPost(id: number, adminId: number) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true, published: true },
    });

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
    });

    if (existing) {
      await this.auditService.logAdminAction(
        adminId,
        'BLOG_UNPUBLISH',
        'BlogPost',
        id,
        { published: existing.published },
        { published: false },
      );
    }

    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      published: result.published,
      published_at: result.publishedAt,
      updated_at: result.updatedAt,
    };
  }
}
