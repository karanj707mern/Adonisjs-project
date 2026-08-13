import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import EmailTemplateService from './email_template_service'
import { ConflictException, NotFoundException } from '@adonisjs/core/http'

@inject()
export default class EmailTemplateController {
  constructor(private emailTemplateService: EmailTemplateService) {}

  async getAll() {
    return this.emailTemplateService.getAll()
  }

  async getOne({ params }: HttpContext) {
    const id = Number(params.id)
    return this.emailTemplateService.getById(id)
  }

  async create({ request, response }: HttpContext) {
    const data = request.all()
    try {
      const record = await this.emailTemplateService.create(data)
      return response.status(201).json(record)
    } catch (error) {
      if ((error as Error).message?.includes('already exists')) {
        throw new ConflictException((error as Error).message)
      }
      throw error
    }
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = request.all()
    try {
      const record = await this.emailTemplateService.update(id, data)
      return response.json(record)
    } catch (error) {
      const message = (error as Error).message
      if (message?.includes('not found')) throw new NotFoundException(message)
      if (message?.includes('already exists')) throw new ConflictException(message)
      throw error
    }
  }

  async remove({ params, response }: HttpContext) {
    const id = Number(params.id)
    try {
      await this.emailTemplateService.delete(id)
      return response.status(204).send('')
    } catch (error) {
      if ((error as Error).message?.includes('not found')) {
        throw new NotFoundException((error as Error).message)
      }
      throw error
    }
  }
}
