import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import type { DatabaseQueryException } from '@adonisjs/lucid/database'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'
import { ConflictException, NotFoundException } from '@adonisjs/core/http'

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

@injectable()
export default class BlogService {
  constructor(
    private db: Database,
    private cache: RedisCacheService,
    private storage: StorageService,
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof DatabaseQueryException &&
      error.code === '23505'
    )
  }

  async createPost(data: Record<string, unknown>) {
    try {
      const postData: Record<string, unknown> = {
        ...data,
        published_at:
          data.publishedAt !== undefined
            ? data.publishedAt
              ? new Date(data.publishedAt as string)
              : null
            : null,
      }
      delete (postData as any).publishedAt
      const postId = await this.db.table('blog_posts').insert(postData)
      const [post] = await this.db
        .table('blog_posts')
        .where('id', postId[0])
        .first()
      await this.invalidateBlogCaches()
      return {
        ...post,
        title: sanitizeHtml(post.title as string),
        excerpt: sanitizeHtml(post.excerpt as string | null),
        content: sanitizeHtml(post.content as string),
      }
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Blog post with this slug already exists.')
      }
      throw error
    }
  }

  async getPublishedPosts() {
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>('blog:published')
    if (cached) {
      return cached
    }

    const posts = await this.db
      .table('blog_posts')
      .where('published', true)
      .orderBy('published_at', 'desc')

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
    }))

    await this.cache.setJson('blog:published', result, 600)
    return result
  }

  async getAllPosts() {
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>('blog:all')
    if (cached) {
      return cached
    }

    const posts = await this.db
      .table('blog_posts')
      .orderBy('created_at', 'desc')

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
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

    const post = await this.db
      .table('blog_posts')
      .where('slug', slug)
      .where('published', true)
      .first()

    if (!post) {
      throw new NotFoundException('Blog post not found')
    }

    const result = {
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
    }

    await this.cache.setJson(cacheKey, result, 600)
    return result
  }

  async updatePost(id: number, data: Record<string, unknown>) {
    const existing = await this.db
      .table('blog_posts')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException('Blog post not found')
    }

    try {
      const updateData: Record<string, unknown> = { ...data }
      if (updateData.publishedAt !== undefined) {
        updateData.published_at = updateData.publishedAt
          ? new Date(updateData.publishedAt as string)
          : null
        delete updateData.publishedAt
      }
      await this.db.table('blog_posts').where('id', id).update(updateData)

      const [updated] = await this.db
        .table('blog_posts')
        .where('id', id)
        .first()

      await this.invalidateBlogCaches()

      return {
        ...updated,
        title: sanitizeHtml(updated.title as string),
        excerpt: sanitizeHtml(updated.excerpt as string | null),
        content: sanitizeHtml(updated.content as string),
      }
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Blog post with this slug already exists.')
      }
      throw error
    }
  }

  async remove(id: number) {
    const post = await this.db
      .table('blog_posts')
      .where('id', id)
      .select('id', 'slug')
      .first()

    if (!post) {
      throw new NotFoundException('Blog post not found')
    }

    await this.db.table('blog_posts').where('id', id).delete()

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
    await Promise.all([
      this.cache.del('blog:published'),
      this.cache.del('blog:all'),
    ])
  }
}
