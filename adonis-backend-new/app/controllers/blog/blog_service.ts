import { inject } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'
function sanitizeHtml(text: string | null): string | null {
  if (!text) {
    return text
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export default class BlogService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject() private cache: RedisCacheService,
    @inject() private storage: StorageService
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }

  async createPost(data: Record<string, unknown>) {
    try {
      const post = await this.prisma.blogPost.create({
        data: {
          ...data,
          publishedAt: data.publishedAt ? new Date(data.publishedAt as string) : null,
        } as any,
      })
      await this.invalidateBlogCaches()
      return post
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw { status: 409, message: 'Blog post with this slug already exists.' }
      }
      throw error
    }
  }

  async getPublishedPosts() {
    const cached = await this.cache.getJson<Record<string, unknown>[]>('blog:published')
    if (cached) {
      return cached
    }

    const posts = await this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    })

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title),
      excerpt: sanitizeHtml(post.excerpt),
      content: sanitizeHtml(post.content),
    }))

    await this.cache.setJson('blog:published', result, 600)
    return result
  }

  async getAllPosts() {
    const cached = await this.cache.getJson<Record<string, unknown>[]>('blog:all')
    if (cached) {
      return cached
    }

    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title),
      excerpt: sanitizeHtml(post.excerpt),
      content: sanitizeHtml(post.content),
    }))

    await this.cache.setJson('blog:all', result, 300)
    return result
  }

  async getPostBySlug(slug: string) {
    const cacheKey = `blog:slug:${slug}`
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey)
    if (cached) {
      return cached
    }

    const post = await this.prisma.blogPost.findFirst({
      where: { slug, published: true },
    })

    if (!post) {
      throw { status: 404, message: 'Blog post not found' }
    }

    const result = {
      ...post,
      title: sanitizeHtml(post.title),
      excerpt: sanitizeHtml(post.excerpt),
      content: sanitizeHtml(post.content),
    }

    await this.cache.setJson(cacheKey, result, 600)
    return result
  }

  async updatePost(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw { status: 404, message: 'Blog post not found' }
    }

    try {
      const updated = await this.prisma.blogPost.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            data.publishedAt !== undefined
              ? data.publishedAt
                ? new Date(data.publishedAt as string)
                : null
              : undefined,
        } as any,
      })

      await this.invalidateBlogCaches()

      return {
        ...updated,
        title: sanitizeHtml(updated.title),
        excerpt: sanitizeHtml(updated.excerpt),
        content: sanitizeHtml(updated.content),
      }
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw { status: 409, message: 'Blog post with this slug already exists.' }
      }
      throw error
    }
  }

  async remove(id: number) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true },
    })

    if (!post) {
      throw { status: 404, message: 'Blog post not found' }
    }

    await this.prisma.blogPost.delete({
      where: { id },
    })

    if (post.slug) {
      await this.cache.del(`blog:slug:${post.slug}`)
    }
    await this.invalidateBlogCaches()
  }

  async uploadBlogImage(file: {
    buffer: Buffer
    mimetype: string
    originalname: string
  }): Promise<{ url: string }> {
    const result = await this.storage.uploadFile(file, 'blog')
    return { url: result.url }
  }

  private async invalidateBlogCaches() {
    await Promise.all([this.cache.del('blog:published'), this.cache.del('blog:all')])
  }
}
