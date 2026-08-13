import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import HeroService from './hero_service'
import { createHeroImageValidator } from './hero_validators'
import { BadRequestException } from '@adonisjs/core/http'

@inject()
export default class HeroController {
  constructor(private heroService: HeroService) {}

  async findAll({ response }: HttpContext) {
    const result = await this.heroService.findAll()
    return response.json(result)
  }

  async findActive({ response }: HttpContext) {
    const result = await this.heroService.findActive()
    return response.json(result)
  }

  async findOne({ params, response }: HttpContext) {
    const id = Number(params.id)
    const result = await this.heroService.findOne(id)
    return response.json(result)
  }

  async create({ request, response }: HttpContext) {
    const data = await request.validateUsing(createHeroImageValidator)
    const result = await this.heroService.create(data)
    return response.status(201).json(result)
  }

  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '50mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    })

    if (!file) {
      throw new BadRequestException('Image file is required')
    }

    const buffer = await file.toBuffer()
    const result = await this.heroService.uploadImage(
      { buffer, mimetype: file.type, originalname: file.clientName },
      request.all()
    )
    return response.status(201).json(result)
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = await request.validateUsing(createHeroImageValidator)
    const result = await this.heroService.update(id, data)
    return response.json(result)
  }

  async remove({ params, response }: HttpContext) {
    const id = Number(params.id)
    await this.heroService.remove(id)
    return response.status(204).send('')
  }
}
