import { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import StorageService from '#services/storage_service';
import { ConflictException, NotFoundException } from '@adonisjs/core/http';

function sanitizeHtml(text: string | null): string | null {
  if (!text) {
    return text;
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export default class BlogService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
    private storage: StorageService,
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return (error as { code: string }).code === 'P2002';
  }

  async createPost(data: Record<string, unknown>) {
    try {
      const postData = { ...data };
      if (postData.publishedAt !== undefined) {
        postData.publishedAt = postData.publishedAt
          ? new Date(postData.publishedAt as string)
          : null;
      }
      const post = await this.prisma.blogPost.create({ data: postData as any });
      await this.invalidateBlogCaches();
      return {
        ...post,
        title: sanitizeHtml(post.title as string),
        excerpt: sanitizeHtml(post.excerpt as string | null),
        content: sanitizeHtml(post.content as string),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Blog post with this slug already exists.');
      }
      throw error;
    }
  }

  async getPublishedPosts() {
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>('blog:published');
    if (cached) {
      return cached;
    }

    const posts = await this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
    }));

    await this.cache.setJson('blog:published', result, 600);
    return result;
  }

  async getAllPosts() {
    const cached =
      await this.cache.getJson<Record<string, unknown>[]>('blog:all');
    if (cached) {
      return cached;
    }

    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const result = posts.map((post) => ({
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
    }));

    await this.cache.setJson('blog:all', result, 300);
    return result;
  }

  async getPostBySlug(slug: string) {
    const cacheKey = `blog:slug:${slug}`;
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const post = await this.prisma.blogPost.findFirst({
      where: { slug, published: true },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const result = {
      ...post,
      title: sanitizeHtml(post.title as string),
      excerpt: sanitizeHtml(post.excerpt as string | null),
      content: sanitizeHtml(post.content as string),
    };

    await this.cache.setJson(cacheKey, result, 600);
    return result;
  }

  async updatePost(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    try {
      const updateData = { ...data };
      if (updateData.publishedAt !== undefined) {
        updateData.publishedAt = updateData.publishedAt
          ? new Date(updateData.publishedAt as string)
          : null;
      }
      const updated = await this.prisma.blogPost.update({
        where: { id },
        data: updateData as any,
      });

      await this.invalidateBlogCaches();

      return {
        ...updated,
        title: sanitizeHtml(updated.title as string),
        excerpt: sanitizeHtml(updated.excerpt as string | null),
        content: sanitizeHtml(updated.content as string),
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Blog post with this slug already exists.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.delete({ where: { id } });

    if (post.slug) {
      await this.cache.del(`blog:slug:${post.slug}`);
    }
    await this.invalidateBlogCaches();
  }

  async uploadBlogImage(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<{ url: string }> {
    const result = await this.storage.uploadFile(file, 'blog');
    return { url: result.url };
  }

  private async invalidateBlogCaches() {
    await Promise.all([
      this.cache.del('blog:published'),
      this.cache.del('blog:all'),
    ]);
  }
}
