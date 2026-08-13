import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/fold'
import Redis from 'ioredis'
import env from '@adonisjs/core/services/env'
import logger from '@adonisjs/core/services/logger'
import amqplib from 'amqplib'
import type { PrismaClient } from '@prisma/client'
import { RabbitMqService } from './notification_queue'

@inject()
export default class HealthController {
  constructor(@inject('Prisma') private prisma: PrismaClient, private rabbitMq: RabbitMqService) {}

  async check() {
    const checks: any = { database: { status: 'down' }, redis: { status: 'not_configured' }, rabbitmq: { status: 'not_configured' } }

    try {
      const start = Date.now()
      await this.prisma.$queryRaw`SELECT 1`
      checks.database = { status: 'ok', latencyMs: Date.now() - start }
    } catch {
      checks.database = { status: 'down' }
    }

    const redisUrl = (env.get('REDIS_URL') || '').trim()
    if (redisUrl) {
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        ...(env.get('NODE_ENV') === 'production' ? { tls: {} } : {}),
        retryStrategy: () => null,
      })
      try {
        const start = Date.now()
        await client.connect()
        await client.ping()
        checks.redis = { status: 'ok', latencyMs: Date.now() - start }
      } catch {
        checks.redis = { status: 'down' }
      } finally {
        void client.quit()
      }
    }

    if (this.rabbitMq.isConfigured) {
      try {
        const start = Date.now()
        const isConnected = await Promise.race([Promise.resolve(this.rabbitMq.isConnected), new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))])
        checks.rabbitmq = { status: isConnected ? 'ok' : 'degraded', latencyMs: isConnected ? Date.now() - start : undefined }
      } catch {
        checks.rabbitmq = { status: 'down' }
      }
    } else {
      checks.rabbitmq = { status: 'not_configured' }
    }

    const allHealthy = checks.database.status === 'ok' && (checks.redis.status === 'ok' || checks.redis.status === 'not_configured') && (checks.rabbitmq.status === 'ok' || checks.rabbitmq.status === 'not_configured')
    return { status: allHealthy ? 'ok' : 'degraded', timestamp: new Date().toISOString(), checks }
  }

  async ready({ response }: HttpContext) {
    const health = await this.check()
    return response.status(health.status === 'ok' ? 200 : 503).json({ status: health.status === 'ok' ? 'ready' : 'not_ready' })
  }

  live({ response }: HttpContext) {
    return response.status(200).json({ status: 'alive' })
  }
}
