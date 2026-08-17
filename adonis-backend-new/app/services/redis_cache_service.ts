import { injectable } from '@adonisjs/fold';
import Redis from 'ioredis';
import env from '@adonisjs/core/services/env';
import logger from '@adonisjs/core/services/logger';

/**
 * Port of the legacy RedisCacheService. Used by controllers/services for
 * caching product/blog listings. Degrades gracefully when REDIS_URL is unset.
 */
@injectable()
export default class RedisCacheService {
  private client: Redis | null = null;
  private redisUrl: string;
  private defaultTtlSeconds: number;

  constructor() {
    this.redisUrl = env.get('REDIS_URL') || '';
    this.defaultTtlSeconds = env.get('REDIS_CACHE_TTL_SECONDS') || 300;

    if (!this.redisUrl) {
      logger.warn('REDIS_URL is not set. Redis cache is disabled.');
      return;
    }

    const isProduction = env.get('NODE_ENV') === 'production';
    this.client = new Redis(this.redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      ...(isProduction ? { tls: {} } : {}),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    this.client.on('error', (error) =>
      logger.error(`Redis cache error: ${error.message}`),
    );
    this.client.on('connect', () => logger.info('Connected to Redis cache'));
  }

  get url() {
    return this.redisUrl;
  }

  get isEnabled() {
    return Boolean(this.client);
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.warn(
        `Failed to parse cached JSON for "${key}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds = this.defaultTtlSeconds,
  ): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }
}
