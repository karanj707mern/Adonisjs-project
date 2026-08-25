import { inject } from '@adonisjs/fold';
import { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import StorageService from '#services/storage_service';
import {
  BadRequestException,
  NotFoundException,
} from '#exceptions/http_exceptions';
import { createHeroImageValidator } from './hero_validators.js';

@inject()
export default class HeroService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
    private storage: StorageService,
  ) {}

  private async getFilesystemImages(): Promise<
    { url: string; alt: string | null; sortOrder: number; active: boolean }[]
  > {
    if (this.storage.isCloudinaryProvider) {
      return [];
    }
    const files = this.storage.listFiles('hero');
    return files.map((file) => ({
      url: this.storage.getSignedUrl(`hero/${file}`),
      alt: null,
      sortOrder: 0,
      active: true,
    }));
  }

  async findAll() {
    const cacheKey = 'hero:all';
    const cached = await this.cache.getJson<
      {
        url: string;
        alt: string | null;
        sortOrder: number;
        active: boolean;
      }[]
    >(cacheKey);
    if (cached) {
      return cached;
    }

    const dbImages = await this.prisma.heroImage.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const fsImages = await this.getFilesystemImages();
    const dbUrls = new Set(dbImages.map((img) => img.url));

    const merged = [...dbImages];
    for (const fsImage of fsImages) {
      if (!dbUrls.has(fsImage.url)) {
        merged.push({
          id: 0,
          url: fsImage.url,
          alt: fsImage.alt,
          sortOrder: fsImage.sortOrder,
          active: fsImage.active,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    merged.sort((a, b) => a.sortOrder - b.sortOrder);
    await this.cache.setJson(cacheKey, merged, 300);
    return merged;
  }

  async findActive() {
    const cacheKey = 'hero:active';
    const cached = await this.cache.getJson<
      {
        url: string;
        alt: string | null;
        sortOrder: number;
        active: boolean;
      }[]
    >(cacheKey);
    if (cached) {
      return cached;
    }

    const dbImages = await this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    const fsImages = await this.getFilesystemImages();
    const dbUrls = new Set(dbImages.map((img) => img.url));

    const merged = [...dbImages];
    for (const fsImage of fsImages) {
      if (!dbUrls.has(fsImage.url)) {
        merged.push({
          id: 0,
          url: fsImage.url,
          alt: fsImage.alt,
          sortOrder: fsImage.sortOrder,
          active: fsImage.active,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    merged.sort((a, b) => a.sortOrder - b.sortOrder);
    await this.cache.setJson(cacheKey, merged, 300);
    return merged;
  }

  async findOne(id: number) {
    const image = await this.prisma.heroImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`Hero image with ID ${id} not found`);
    }

    return image;
  }

  async create(data: Record<string, unknown>) {
    const result = await this.prisma.heroImage.create({
      data: {
        url: data.url as string,
        alt: (data.alt as string | null | undefined) ?? null,
        sortOrder: (data.sortOrder as number | undefined) ?? 0,
        active: (data.active as boolean | undefined) ?? true,
      },
    });

    await this.cache.del('hero:all');
    await this.cache.del('hero:active');

    return result;
  }

  async uploadImage(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    metadata?: Record<string, unknown>,
  ) {
    const result = await this.storage.uploadFile(file, 'hero', 'home-hero');

    return this.create({
      url: result.url,
      alt: typeof metadata?.alt === 'string' ? metadata.alt : null,
      sortOrder:
        typeof metadata?.sortOrder === 'number' ? metadata.sortOrder : 0,
      active: metadata?.active !== undefined ? Boolean(metadata.active) : true,
    });
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.heroImage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Hero image with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.url !== undefined) updateData.url = data.url as string;
    if (data.alt !== undefined) updateData.alt = data.alt as string | null;
    if (data.sortOrder !== undefined)
      updateData.sortOrder = data.sortOrder as number;
    if (data.active !== undefined) updateData.active = data.active as boolean;

    const result = await this.prisma.heroImage.update({
      where: { id },
      data: updateData,
    });

    await this.cache.del('hero:all');
    await this.cache.del('hero:active');

    return result;
  }

  async remove(id: number) {
    const existing = await this.prisma.heroImage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Hero image with ID ${id} not found`);
    }

    await this.prisma.heroImage.delete({
      where: { id },
    });

    await this.cache.del('hero:all');
    await this.cache.del('hero:active');
  }
}
