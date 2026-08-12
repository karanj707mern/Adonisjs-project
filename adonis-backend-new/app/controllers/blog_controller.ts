import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'

export default class BlogController {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async index({ response }: HttpContext) {
    const posts = await this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: posts,
    })
  }

  async show({ params, response }: HttpContext) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug: params.slug },
    })

    if (!post) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Blog post not found',
      })
    }

    return response.json({
      statusCode: 200,
      data: post,
    })
  }
}
