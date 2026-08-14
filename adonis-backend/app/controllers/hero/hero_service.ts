import { injectable } from '@adonisjs/fold';
import type { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import StorageService from '#services/storage_service';
import { BadRequestException, NotFoundException } from '@adonisjs/core/http';
import { createHeroImageValidator } from './hero_validators';

@injectable()
export default class HeroService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject('RedisCache') private cache: RedisCacheService,
    @inject('Storage') private storage: StorageService,
  ) {}

  async findAll() {
    const cacheKey = 'hero:all';
    const cached =
      await this.cache.getJson<
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

    await this.cache.setJson(cacheKey, dbImages, 300);
    return dbImages;
  }

  async findActive() {
    const cacheKey = 'hero:active';
    const cached =
      await this.cache.getJson<
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

    await this.cache.setJson(cacheKey, dbImages, 300);
    return dbImages;
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
