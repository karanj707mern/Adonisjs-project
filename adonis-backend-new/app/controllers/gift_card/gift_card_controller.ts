import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import GiftCardService from './gift_card_service.ts'
import { createGiftCardValidator, updateGiftCardValidator } from './gift_card_validators.ts'
@inject()
export default class GiftCardController {
  constructor(@inject() private giftCardService: GiftCardService) {}

  async redeem({ auth, request, response }: HttpContext) {
    const body = request.all()
    const code = String(body.code || '')

    if (!code) {
      throw { status: 400, message: 'Gift card code is required.' }
    }

    const userId = (auth as { user?: { id: number } } | undefined)?.user?.id ?? null
    const result = await this.giftCardService.redeem(code, userId)
    return response.json(result)
  }

  async balance({ request, response }: HttpContext) {
    const code = String(request.input('code') || '')

    if (!code) {
      throw { status: 400, message: 'Gift card code is required.' }
    }

    const result = await this.giftCardService.getBalance(code)
    return response.json(result)
  }

  async findAll({ response }: HttpContext) {
    const result = await this.giftCardService.findAll()
    return response.json(result)
  }

  async findOne({ params, response }: HttpContext) {
    const id = Number(params.id)
    const result = await this.giftCardService.findOne(id)
    return response.json(result)
  }

  async create({ request, response }: HttpContext) {
    const data = await request.validateUsing(createGiftCardValidator)
    const result = await this.giftCardService.create(data)
    return response.status(201).json(result)
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = await request.validateUsing(updateGiftCardValidator)
    const result = await this.giftCardService.update(id, data)
    return response.json(result)
  }

  async remove({ params, response }: HttpContext) {
    const id = Number(params.id)
    await this.giftCardService.remove(id)
    return response.status(204).send('')
  }
}
