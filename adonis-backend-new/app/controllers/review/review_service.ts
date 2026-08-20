import PrismaService from '#services/prisma_service';
import RedisCacheService from '#services/redis_cache_service';
import EmailVerificationService from '#controllers/auth/services/email_verification_service';
import { 
  BadRequestException,
  ConflictException,
  NotFoundException,
 } from '#exceptions/http_exceptions';
import { PrismaClient } from '@prisma/client';
import { ReviewStatus } from '#models/review';

export default class ReviewService {
  constructor(
    private prisma: PrismaClient,
    private emailVerificationService: EmailVerificationService,
    private cache: RedisCacheService,
  ) {}

  static readonly PRODUCT_REVIEW_CACHE_PREFIX = 'reviews:product:';
  static readonly FEATURED_REVIEW_CACHE_PREFIX = 'reviews:featured:';
  static readonly DEFAULT_FEATURED_REVIEWS_LIMIT = 6;
  static readonly DEFAULT_FEATURED_CACHE_TTL = 300;
  private isMissingReviewTable(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2021'
    );
  }

  private getUnavailableReviewPayload() {
    return {
      summary: {
        averageRating: 0,
        reviewCount: 0,
        ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: 0,
        })),
      },
      reviews: [],
    };
  }

  private getUnavailableFeaturedReviewPayload() {
    return {
      reviews: [],
    };
  }

  private async ensureProductExists(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async getEligibleDeliveredOrder(userId: number, productId: number) {
    const result = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
        order: { status: 'DELIVERED' },
      },
      include: {
        order: {
          select: { id: true },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });

    if (!result) return null;

    return {
      id: result.id,
      order: result.order ? { id: result.order.id } : null,
    };
  }

  private sanitizeHtml(text: string | null): string | null {
    if (!text) return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  async getFeaturedReviews(limit = 6) {
    const cacheKey = `reviews:featured:${limit}`;
    const cached = await this.cache.getJson<{
      reviews: {
        id: number;
        title: string | null;
        content: string;
        user: { id: number; name: string };
        product: { id: number; name: string; image: string };
      }[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    let reviews: {
      id: number;
      title: string | null;
      content: string;
      user: { id: number; name: string };
      product: { id: number; name: string; image: string };
    }[];

    try {
      const rawReviews = await this.prisma.review.findMany({
        where: { status: ReviewStatus.APPROVED },
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      reviews = rawReviews.map((review) => ({
        id: review.id,
        title: review.title ? this.sanitizeHtml(review.title) : null,
        content: this.sanitizeHtml(review.content)!,
        user: { id: review.user.id, name: review.user.name },
        product: {
          id: review.product.id,
          name: review.product.name,
          image: review.product.image,
        },
      }));
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableFeaturedReviewPayload();
      }
      throw error;
    }

    const result = { reviews };

    await this.cache.setJson(cacheKey, result, 300);
    return result;
  }

  async getProductReviews(productId: number) {
    await this.ensureProductExists(productId);
    const cacheKey = `reviews:product:${productId}`;
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    let reviews: { rating: number; [key: string]: unknown }[];

    try {
      const rawReviews = await this.prisma.review.findMany({
        where: { productId, status: ReviewStatus.APPROVED },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      reviews = rawReviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title ? this.sanitizeHtml(review.title) : null,
        content: this.sanitizeHtml(review.content),
        user: { id: review.user.id, name: review.user.name },
        comments: [],
      }));
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return this.getUnavailableReviewPayload();
      }
      throw error;
    }

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviewCount
            ).toFixed(1),
          )
        : 0;

    const result = {
      summary: {
        averageRating,
        reviewCount,
        ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: reviews.filter((review) => review.rating === rating).length,
        })),
      },
      reviews,
    };

    await this.cache.setJson(cacheKey, result, 300);
    return result;
  }

  async getReviewEligibility(userId: number, productId: number) {
    await this.ensureProductExists(productId);

    try {
      const [existingReview, qualifyingOrder] = await Promise.all([
        this.prisma.review.findFirst({
          where: { userId, productId },
          select: { id: true },
        }),
        this.getEligibleDeliveredOrder(userId, productId),
      ]);

      if (existingReview) {
        return {
          canReview: false,
          hasReviewed: true,
          reason: 'You already posted a review for this product.',
        };
      }

      if (!qualifyingOrder) {
        return {
          canReview: false,
          hasReviewed: false,
          reason: 'Buy this product first to unlock reviews.',
        };
      }

      return {
        canReview: true,
        hasReviewed: false,
        reason: 'You can rate and review this item.',
      };
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        return {
          canReview: false,
          hasReviewed: false,
          reason:
            'Reviews will be available after the database update is applied.',
        };
      }
      throw error;
    }
  }

  async createReview(
    userId: number,
    productId: number,
    dto: Record<string, unknown>,
  ) {
    await this.ensureProductExists(productId);
    const content = String(dto.content).trim();
    const title =
      dto.title !== undefined ? String(dto.title).trim() || null : null;

    if (!content) {
      throw new BadRequestException('Review content cannot be empty.');
    }

    let existingReview: { id: number } | null;
    let qualifyingOrder: { id: number; order: { id: number } | null } | null;

    try {
      [existingReview, qualifyingOrder] = await Promise.all([
        this.prisma.review.findFirst({
          where: { userId, productId },
          select: { id: true },
        }),
        this.getEligibleDeliveredOrder(userId, productId) as Promise<{
          id: number;
          order: { id: number } | null;
        } | null>,
      ]);
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Reviews are not available yet. Apply the latest database migration and try again.',
        );
      }
      throw error;
    }

    if (existingReview) {
      throw new ConflictException('You already reviewed this product.');
    }

    if (!qualifyingOrder?.order) {
      throw new BadRequestException(
        'You can only review products you have purchased.',
      );
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          productId,
          orderId: qualifyingOrder.order.id,
          rating: Number(dto.rating),
          title,
          content,
          status: ReviewStatus.PENDING,
        },
      });

      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        await this.emailVerificationService.sendReviewPosted(
          user.email,
          user.name,
          userId,
        );
      }

      await this.cache.del(
        `${ReviewService.PRODUCT_REVIEW_CACHE_PREFIX}${productId}`,
      );
      await this.cache.del(
        `${ReviewService.FEATURED_REVIEW_CACHE_PREFIX}${ReviewService.DEFAULT_FEATURED_REVIEWS_LIMIT}`,
      );

      return {
        ...review,
        title: review.title ? this.sanitizeHtml(review.title) : null,
        content: this.sanitizeHtml(review.content),
      };
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Reviews are not available yet. Apply the latest database migration and try again.',
        );
      }
      throw error;
    }
  }

  async moderateReview(
    reviewId: number,
    dto: Record<string, unknown>,
  ): Promise<{ id: number; status: ReviewStatus; adminNote: string | null }> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId },
      select: { id: true, status: true, adminNote: true, productId: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status:
          dto.status === 'APPROVED'
            ? ReviewStatus.APPROVED
            : ReviewStatus.REJECTED,
        adminNote: dto.adminNote ?? null,
      },
    });

    const updatedReview = await this.prisma.review.findFirst({
      where: { id: reviewId },
      select: { id: true, status: true, adminNote: true },
    });

    await this.cache.del(
      `${ReviewService.PRODUCT_REVIEW_CACHE_PREFIX}${review.productId}`,
    );
    await this.cache.del(
      `${ReviewService.FEATURED_REVIEW_CACHE_PREFIX}${ReviewService.DEFAULT_FEATURED_REVIEWS_LIMIT}`,
    );

    return {
      id: updatedReview!.id,
      status: updatedReview!.status,
      adminNote: updatedReview!.adminNote,
    };
  }

  async getPendingReviews(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: ReviewStatus.PENDING },
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createComment(
    userId: number,
    reviewId: number,
    dto: Record<string, unknown>,
  ) {
    const content = String(dto.content).trim();

    if (!content) {
      throw new BadRequestException('Comment content cannot be empty.');
    }

    let review: { id: number; productId: number } | null;

    try {
      review = await this.prisma.review.findFirst({
        where: { id: reviewId },
        select: { id: true, productId: true },
      });
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Review comments are not available yet. Apply the latest database migration and try again.',
        );
      }
      throw error;
    }

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    try {
      const comment = await this.prisma.reviewComment.create({
        data: {
          reviewId,
          userId,
          content,
        },
      });

      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        await this.emailVerificationService.sendCommentPosted(
          user.email,
          user.name,
          userId,
        );
      }

      await this.cache.del(
        `${ReviewService.PRODUCT_REVIEW_CACHE_PREFIX}${review.productId}`,
      );

      return {
        id: comment.id,
        content: this.sanitizeHtml(comment.content),
      };
    } catch (error: unknown) {
      if (this.isMissingReviewTable(error)) {
        throw new BadRequestException(
          'Review comments are not available yet. Apply the latest database migration and try again.',
        );
      }
      throw error;
    }
  }
}
