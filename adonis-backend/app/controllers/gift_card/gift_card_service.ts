import { injectable } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import crypto from 'node:crypto'
import { createGiftCardValidator, updateGiftCardValidator } from './gift_card_validators'

@injectable()
export default class GiftCardService {
  constructor(@inject('Prisma') private prisma: PrismaClient) {}

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase()
  }

  private generateCode(length = 12): string {
    const bytes = crypto.randomBytes(length)
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, length)
      .toUpperCase()
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
        lastUsedAt: true,
      },
    })
  }

  async findOne(id: number) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { id },
    })

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.')
    }

    return giftCard
  }

  async create(data: Record<string, unknown>) {
    const code = this.normalizeCode((data.code as string | undefined) || this.generateCode())

    const existing = await this.prisma.giftCard.findFirst({
      where: { code },
    })

    if (existing) {
      throw new BadRequestException('Gift card code already exists.')
    }

    return this.prisma.giftCard.create({
      data: {
        code,
        initialAmount: data.amount as number,
        remainingAmount: data.amount as number,
        currency: (data.currency as string | undefined) || 'INR',
        isActive: (data.isActive as boolean | undefined) ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt as string | Date) : null,
      },
    })
  }

  async update(id: number, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {}

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt as string | Date) : null
    }

    return this.prisma.giftCard.update({
      where: { id },
      data: updateData,
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.giftCard.delete({
      where: { id },
    })
  }

  async redeem(code: string, _userId: number) {
    const normalizedCode = this.normalizeCode(code)

    const giftCard = await this.prisma.giftCard.findFirst({
      where: { code: normalizedCode },
    })

    if (!giftCard) {
      throw new BadRequestException('Invalid gift card code.')
    }

    if (!giftCard.isActive) {
      throw new BadRequestException('This gift card is no longer active.')
    }

    if (giftCard.remainingAmount <= 0) {
      throw new BadRequestException('This gift card has no remaining balance.')
    }

    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      throw new BadRequestException('This gift card has expired.')
    }

    if (giftCard.redeemedBy && giftCard.redeemedAt) {
      throw new BadRequestException(
        'This gift card has already been redeemed.'
      )
    }

    const updatedGiftCard = await this.prisma.giftCard.update({
      where: { id: giftCard.id },
      data: {
        isActive: false,
        redeemedBy: _userId,
        redeemedAt: new Date(),
        lastUsedAt: new Date(),
        remainingAmount: { decrement: giftCard.remainingAmount },
      },
    })

    return updatedGiftCard
  }

  async getBalance(code: string) {
    const normalizedCode = this.normalizeCode(code)
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
        lastUsedAt: true,
      },
    })

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.')
    }

    return giftCard
  }
}
