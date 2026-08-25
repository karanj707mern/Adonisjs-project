import { inject } from '@adonisjs/fold';
import Redis from 'ioredis';
import env from '#start/env';

/**
 * Port of the legacy RedisCacheService. Used by controllers/services for
 * caching product/blog listings. Degrades gracefully when REDIS_URL is unset.
 */
@inject()
export default class RedisCacheService {
  private client: Redis | null = null;
  private redisUrl: string;
  private defaultTtlSeconds: number;

  constructor() {
    this.redisUrl = env.get('REDIS_URL') || '';
    this.defaultTtlSeconds = env.get('REDIS_CACHE_TTL_SECONDS') || 300;

    if (!this.redisUrl) {
      console.warn('REDIS_URL is not set. Redis cache is disabled.');
      return;
    }

    const isProduction = env.get('NODE_ENV') === 'production';
    // @ts-ignore ioredis constructor typing is incompatible here
    this.client = new Redis(this.redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      ...(isProduction ? { tls: {} } : {}),
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });
    this.client.on('error', (error: Error) =>
      console.error(`Redis cache error: ${error.message}`),
    );
    this.client.on('connect', () => console.info('Connected to Redis cache'));
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
      console.warn(
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

  /** Raw string get (counters, flags, locks) */
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  /** Raw string set with optional TTL */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /** Gracefully close Redis connection on shutdown */
  async destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
      } catch (error) {
        console.error(
          `Redis cache disconnect error: ${(error as Error).message}`,
        );
      }
    }
  }
}
