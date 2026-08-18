import { PrismaClient } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@adonisjs/core/http';
import crypto from 'node:crypto';
import {
  createGiftCardValidator,
  updateGiftCardValidator,
} from './gift_card_validators';

export default class GiftCardService {
  constructor(private prisma: PrismaClient) {}

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private generateCode(length = 12): string {
    const bytes = crypto.randomBytes(length);
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, length)
      .toUpperCase();
  }

  async findAll() {
    return this.prisma.giftCard.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        initialAmount: true,
        remainingAmount: true,
        currency: true,
        isActive: true,
        redeemedBy: true,
        redeemedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { id },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.');
    }

    return giftCard;
  }

  async create(data: Record<string, unknown>) {
    const code = this.normalizeCode(
      (data.code as string | undefined) || this.generateCode(),
    );

    const existing = await this.prisma.giftCard.findUnique({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException('Gift card code already exists.');
    }

    const giftCard = await this.prisma.giftCard.create({
      data: {
        code,
        initialAmount: data.amount as number,
        remainingAmount: data.amount as number,
        currency: (data.currency as string | undefined) || 'INR',
        isActive: (data.isActive as boolean | undefined) ?? true,
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt as string | Date)
          : null,
      },
    });

    return giftCard;
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.giftCard.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Gift card not found.');
    }

    const updateData: Record<string, unknown> = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt
        ? new Date(data.expiresAt as string | Date)
        : null;
    }

    const giftCard = await this.prisma.giftCard.update({
      where: { id },
      data: updateData,
    });

    return giftCard;
  }

  async remove(id: number) {
    const existing = await this.prisma.giftCard.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Gift card not found.');
    }

    await this.prisma.giftCard.delete({
      where: { id },
    });

    return { message: 'Gift card removed' };
  }

  async redeem(code: string, userId: number) {
    const normalizedCode = this.normalizeCode(code);

    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: normalizedCode },
    });

    if (!giftCard) {
      throw new BadRequestException('Invalid gift card code.');
    }

    if (!giftCard.isActive) {
      throw new BadRequestException('This gift card is no longer active.');
    }

    if (giftCard.remainingAmount <= 0) {
      throw new BadRequestException('This gift card has no remaining balance.');
    }

    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      throw new BadRequestException('This gift card has expired.');
    }

    if (giftCard.redeemedBy && giftCard.redeemedAt) {
      throw new BadRequestException(
        'This gift card has already been redeemed.',
      );
    }

    const updateData: Record<string, unknown> = {
      isActive: false,
      remainingAmount: 0,
    };

    if (userId > 0) {
      updateData.redeemedBy = userId;
      updateData.redeemedAt = new Date();
      updateData.lastUsedAt = new Date();
    }

    const updatedGiftCard = await this.prisma.giftCard.update({
      where: { id: giftCard.id },
      data: updateData,
    });

    return updatedGiftCard;
  }

  async getBalance(code: string) {
    const normalizedCode = this.normalizeCode(code);
    const giftCard = await this.prisma.giftCard.findFirst({
      where: { code: normalizedCode },
      select: {
        id: true,
        code: true,
        initialAmount: true,
        remainingAmount: true,
        currency: true,
        isActive: true,
        redeemedAt: true,
        expiresAt: true,
      },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.');
    }

    return giftCard;
  }
}
