import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import NewArrivalService from './new_arrival_service.ts'
import { createNewArrivalValidator } from './new_arrival_validators.ts'
@inject()
export default class NewArrivalController {
  constructor(@inject() private newArrivalService: NewArrivalService) {}

  async findAll({ response }: HttpContext) {
    const result = await this.newArrivalService.findAll()
    return response.json(result)
  }

  async findActive({ response }: HttpContext) {
    const result = await this.newArrivalService.findActive()
    return response.json(result)
  }

  async findOne({ params, response }: HttpContext) {
    const id = Number(params.id)
    const result = await this.newArrivalService.findOne(id)
    return response.json(result)
  }

  async create({ request, response }: HttpContext) {
    const data = await request.validateUsing(createNewArrivalValidator)
    const result = await this.newArrivalService.create(data)
    return response.status(201).json(result)
  }

  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '50mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    })

    if (!file) {
      throw { status: 400, message: 'Image file is required' }
    }

    const fileName = `${Date.now()}-${file.clientName ?? 'file'}`
    await file.move(app.tmpPath('uploads'), { name: fileName })
    const buffer = file.tmpPath ? await readFile(file.tmpPath) : Buffer.alloc(0)
    const result = await this.newArrivalService.uploadImage(
      { buffer, mimetype: file.type ?? '', originalname: file.clientName ?? fileName },
      request.all()
    )
    return response.status(201).json(result)
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = await request.validateUsing(createNewArrivalValidator)
    const result = await this.newArrivalService.update(id, data)
    return response.json(result)
  }

  async remove({ params, response }: HttpContext) {
    const id = Number(params.id)
    await this.newArrivalService.remove(id)
    return response.status(204).send('')
  }
}
