import { PrismaClient, CouponDiscountType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@adonisjs/core/http';

export default class CouponService {
  constructor(private prisma: PrismaClient) {}

  async validate(code: string, orderValue: number) {
    const upperCode = code.toUpperCase();
    const now = new Date();

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: upperCode,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code.');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit.');
    }

    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required for this coupon.`,
      );
    }

    let discountAmount: number;

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: Math.max(0, orderValue - discountAmount),
    };
  }

  async validateForUser(code: string, orderValue: number, userId: number) {
    const upperCode = code.toUpperCase();
    const now = new Date();

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: upperCode,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code.');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit.');
    }

    if (
      userId > 0 &&
      coupon.perUserLimit !== null &&
      coupon.perUserLimit !== undefined
    ) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        throw new BadRequestException(
          'You have reached the maximum number of times this coupon can be used.',
        );
      }
    }

    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required for this coupon.`,
      );
    }

    let discountAmount: number;

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: Math.max(0, orderValue - discountAmount),
    };
  }

  async recordUsage(couponId: number, userId: number, orderId: number) {
    await this.prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findFirst({
        where: { id: couponId },
        select: { id: true, usageLimit: true, usedCount: true },
      });

      if (!coupon) {
        throw new BadRequestException('Coupon not found.');
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException(
          'This coupon has reached its usage limit.',
        );
      }

      await tx.couponUsage.create({
        data: { couponId, userId, orderId },
      });

      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    });
  }

  async getCouponAnalytics() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((coupon) => {
      return {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        perUserLimit: coupon.perUserLimit,
        isActive: coupon.isActive,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        totalUsages: 0,
        totalDiscountGiven:
          coupon.discountType === 'FIXED'
            ? (coupon.usedCount || 0) * coupon.discountValue
            : 0,
      };
    });
  }

  async create(data: Record<string, unknown>) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: (data.code as string).trim().toUpperCase(),
        discountType: data.discountType as CouponDiscountType,
        discountValue: data.discountValue as number,
        minOrderValue:
          (data.minOrderValue as number | null | undefined) ?? null,
        maxDiscount: (data.maxDiscount as number | null | undefined) ?? null,
        perUserLimit: (data.perUserLimit as number | null | undefined) ?? null,
        usageLimit: (data.usageLimit as number | null | undefined) ?? null,
        validFrom: new Date(data.validFrom as string | Date),
        validUntil: new Date(data.validUntil as string | Date),
      },
    });

    return coupon;
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.coupon.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Coupon not found');
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        code: (data.code as string).trim().toUpperCase(),
        discountType: data.discountType as CouponDiscountType,
        discountValue: data.discountValue as number,
        minOrderValue:
          (data.minOrderValue as number | null | undefined) ?? null,
        maxDiscount: (data.maxDiscount as number | null | undefined) ?? null,
        perUserLimit: (data.perUserLimit as number | null | undefined) ?? null,
        usageLimit: (data.usageLimit as number | null | undefined) ?? null,
        validFrom: new Date(data.validFrom as string | Date),
        validUntil: new Date(data.validUntil as string | Date),
      },
    });

    return coupon;
  }

  async remove(id: number) {
    const existing = await this.prisma.coupon.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: 'Coupon removed' };
  }
}
