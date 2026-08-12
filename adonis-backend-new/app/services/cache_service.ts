import { Redis } from '#adonisjs/redis'

export class CacheService {
  private defaultTtl: number

  constructor() {
    this.defaultTtl = parseInt(process.env.REDIS_CACHE_TTL_SECONDS || '300')
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await Redis.connection().get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTtl): Promise<void> {
    try {
      await Redis.connection().setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await Redis.connection().del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await Redis.connection().keys(pattern)
      if (keys.length > 0) {
        await Redis.connection().del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
    }
  }

  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`
  }
}
