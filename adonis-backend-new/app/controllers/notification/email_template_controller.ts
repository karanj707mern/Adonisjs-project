import type { HttpContext } from '@adonisjs/core/http'
import EmailTemplateService from './email_template_service.ts'
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
    const body = request.all()
    const data = {
      name: String(body.name || ''),
      subject: String(body.subject || ''),
      htmlBody: String(body.htmlBody || ''),
      textBody: body.textBody ? String(body.textBody) : undefined,
      variables: body.variables,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    }
    try {
      const record = await this.emailTemplateService.create(data)
      return response.status(201).json(record)
    } catch (error) {
      if ((error as Error).message?.includes('already exists')) {
        throw { status: 409, message: (error as Error).message }
      }
      throw error
    }
  }

  async update({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const body = request.all()
    const data = {
      name: body.name ? String(body.name) : undefined,
      subject: body.subject ? String(body.subject) : undefined,
      htmlBody: body.htmlBody ? String(body.htmlBody) : undefined,
      textBody: body.textBody ? String(body.textBody) : undefined,
      variables: body.variables,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    }
    try {
      const record = await this.emailTemplateService.update(id, data)
      return response.json(record)
    } catch (error) {
      const message = (error as Error).message
      if (message?.includes('not found')) throw { status: 404, message: message }
      if (message?.includes('already exists')) throw { status: 409, message: message }
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
        throw { status: 404, message: (error as Error).message }
      }
      throw error
    }
  }
}
