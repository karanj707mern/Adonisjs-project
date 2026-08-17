import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import { BadRequestException } from '@adonisjs/core/http';
import BlogService from './blog_service';
import {
  createBlogPostValidator,
  updateBlogPostValidator,
} from './blog_validators';

@inject()
export default class BlogController {
  constructor(private blogService: BlogService) {}

  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '50mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    });
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }

    const buffer = await file.toBuffer();
    const result = await this.blogService.uploadBlogImage({
      buffer,
      mimetype: file.type,
      originalname: file.clientName,
    });
    return response.status(201).json(result);
  }

  async createPost({ request, response }: HttpContext) {
    const data = await request.validateUsing(createBlogPostValidator);
    const result = await this.blogService.createPost(data);
    return response.status(201).json(result);
  }

  async getPublishedPosts({ response }: HttpContext) {
    const result = await this.blogService.getPublishedPosts();
    return response.json(result);
  }

  async getAllPosts({ response }: HttpContext) {
    const result = await this.blogService.getAllPosts();
    return response.json(result);
  }

  async getPostBySlug({ params, response }: HttpContext) {
    const slug = params.slug as string;
    const result = await this.blogService.getPostBySlug(slug);
    return response.json(result);
  }

  async updatePost({ params, request, response }: HttpContext) {
    const id = Number(params.id);
    const data = await request.validateUsing(updateBlogPostValidator);
    const result = await this.blogService.updatePost(id, data);
    return response.json(result);
  }

  async deletePost({ params, response }: HttpContext) {
    const id = Number(params.id);
    await this.blogService.remove(id);
    return response.status(204).send('');
  }
}
