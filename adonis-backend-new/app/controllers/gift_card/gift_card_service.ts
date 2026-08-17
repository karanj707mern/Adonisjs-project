import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import crypto from 'node:crypto'
import {
  createGiftCardValidator,
  updateGiftCardValidator,
} from './gift_card_validators'

@injectable()
export default class GiftCardService {
  constructor(private db: Database) {}

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
    return this.db
      .table('gift_cards')
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'code',
        'initial_amount',
        'remaining_amount',
        'currency',
        'is_active',
        'redeemed_by',
        'redeemed_at',
        'expires_at',
        'created_at',
        'updated_at',
      )
  }

  async findOne(id: number) {
    const giftCard = await this.db.table('gift_cards').where('id', id).first()

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.')
    }

    return giftCard
  }

  async create(data: Record<string, unknown>) {
    const code = this.normalizeCode(
      (data.code as string | undefined) || this.generateCode(),
    )

    const existing = await this.db
      .table('gift_cards')
      .where('code', code)
      .first()

    if (existing) {
      throw new BadRequestException('Gift card code already exists.')
    }

    const insertId = await this.db.table('gift_cards').insert({
      code,
      initial_amount: data.amount as number,
      remaining_amount: data.amount as number,
      currency: (data.currency as string | undefined) || 'INR',
      is_active: (data.isActive as boolean | undefined) ?? true,
      expires_at: data.expiresAt
        ? new Date(data.expiresAt as string | Date)
        : null,
    })

    const [result] = await this.db
      .table('gift_cards')
      .where('id', insertId[0])
      .first()

    return result
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.db
      .table('gift_cards')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException('Gift card not found.')
    }

    const updateData: Record<string, unknown> = {}
    if (data.isActive !== undefined) updateData.is_active = data.isActive
    if (data.expiresAt !== undefined) {
      updateData.expires_at = data.expiresAt
        ? new Date(data.expiresAt as string | Date)
        : null
    }

    await this.db.table('gift_cards').where('id', id).update(updateData)

    const [result] = await this.db
      .table('gift_cards')
      .where('id', id)
      .first()

    return result
  }

  async remove(id: number) {
    await this.findOne(id)
    await this.db.table('gift_cards').where('id', id).delete()

    return { message: 'Gift card removed' }
  }

  async redeem(code: string, userId: number) {
    const normalizedCode = this.normalizeCode(code)

    const giftCard = await this.db
      .table('gift_cards')
      .where('code', normalizedCode)
      .first()

    if (!giftCard) {
      throw new BadRequestException('Invalid gift card code.')
    }

    if (!giftCard.is_active) {
      throw new BadRequestException('This gift card is no longer active.')
    }

    if (giftCard.remaining_amount <= 0) {
      throw new BadRequestException('This gift card has no remaining balance.')
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      throw new BadRequestException('This gift card has expired.')
    }

    if (giftCard.redeemed_by && giftCard.redeemed_at) {
      throw new BadRequestException(
        'This gift card has already been redeemed.',
      )
    }

    const updateData: Record<string, unknown> = {
      is_active: false,
      remaining_amount: 0,
    }

    if (userId > 0) {
      updateData.redeemed_by = userId
      updateData.redeemed_at = new Date()
      updateData.last_used_at = new Date()
    }

    await this.db.table('gift_cards').where('id', giftCard.id).update(updateData)

    const [updatedGiftCard] = await this.db
      .table('gift_cards')
      .where('id', giftCard.id)
      .first()

    return updatedGiftCard
  }

  async getBalance(code: string) {
    const normalizedCode = this.normalizeCode(code)
    const giftCard = await this.db
      .table('gift_cards')
      .where('code', normalizedCode)
      .select(
        'id',
        'code',
        'initial_amount',
        'remaining_amount',
        'currency',
        'is_active',
        'redeemed_at',
        'expires_at',
      )
      .first()

    if (!giftCard) {
      throw new NotFoundException('Gift card not found.')
    }

    return giftCard
  }
}
