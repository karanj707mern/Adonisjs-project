import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import BlogService from './blog_service.ts'
import { createBlogPostValidator, updateBlogPostValidator } from './blog_validators.ts'

@inject()
export default class BlogController {
  constructor(@inject() private blogService: BlogService) {}

  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '50mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    })
    if (!file) {
      throw { status: 400, message: 'An image file is required.' }
    }

    const fileName = `${Date.now()}-${file.clientName ?? 'file'}`
    await file.move(app.tmpPath('uploads'), { name: fileName })
    const buffer = file.tmpPath ? await readFile(file.tmpPath) : Buffer.alloc(0)
    const result = await this.blogService.uploadBlogImage({
      buffer,
      mimetype: file.type ?? '',
      originalname: file.clientName ?? fileName,
    })
    return response.status(201).json(result)
  }

  async createPost({ request, response }: HttpContext) {
    const data = await request.validateUsing(createBlogPostValidator)
    const result = await this.blogService.createPost(data)
    return response.status(201).json(result)
  }

  async getPublishedPosts({ response }: HttpContext) {
    const result = await this.blogService.getPublishedPosts()
    return response.json(result)
  }

  async getAllPosts({ response }: HttpContext) {
    const result = await this.blogService.getAllPosts()
    return response.json(result)
  }

  async getPostBySlug({ params, response }: HttpContext) {
    const slug = params.slug as string
    const result = await this.blogService.getPostBySlug(slug)
    return response.json(result)
  }

  async updatePost({ params, request, response }: HttpContext) {
    const id = Number(params.id)
    const data = await request.validateUsing(updateBlogPostValidator)
    const result = await this.blogService.updatePost(id, data)
    return response.json(result)
  }

  async deletePost({ params, response }: HttpContext) {
    const id = Number(params.id)
    await this.blogService.remove(id)
    return response.status(204).send('')
  }
}
