import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class HeroController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async active({ response }: HttpContext) {
    const images = await this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })

    return response.json({
      statusCode: 200,
      data: images,
    })
  }

  async index({ response }: HttpContext) {
    const images = await this.prisma.heroImage.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return response.json({
      statusCode: 200,
      data: images,
    })
  }

  async store({ request, response }: HttpContext) {
    const data = request.body()

    const image = await this.prisma.heroImage.create({
      data: {
        url: data.url,
        alt: data.alt,
        sortOrder: data.sortOrder ?? 0,
        active: data.active ?? true,
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Hero image created successfully',
      data: image,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const data = request.body()

    const image = await this.prisma.heroImage.update({
      where: { id: parseInt(params.id) },
      data,
    })

    return response.json({
      statusCode: 200,
      message: 'Hero image updated successfully',
      data: image,
    })
  }

  async destroy({ params, response }: HttpContext) {
    await this.prisma.heroImage.delete({
      where: { id: parseInt(params.id) },
    })

    return response.json({
      statusCode: 200,
      message: 'Hero image deleted successfully',
    })
  }
}
