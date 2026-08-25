import type { HttpContext } from '@adonisjs/core/http';
import Redis from 'ioredis';
import amqplib from 'amqplib';
import env from '#start/env';
import PrismaService from '#services/prisma_service';

export default class HealthController {
  async check() {
    const checks: any = {
      database: { status: 'down' },
      redis: { status: 'not_configured' },
      rabbitmq: { status: 'not_configured' },
    };

    // Database check — use shared PrismaService
    try {
      const start = Date.now();
      const prisma = new PrismaService();
      await prisma.getClient().$queryRaw`SELECT 1`;
      checks.database = { status: 'ok', latencyMs: Date.now() - start };
    } catch {
      checks.database = { status: 'down' };
    }

    // Redis check
    const redisUrl = (env.get('REDIS_URL') || '').trim();
    if (redisUrl) {
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        ...(env.get('NODE_ENV') === 'production' ? { tls: {} } : {}),
        retryStrategy: () => null,
      });
      try {
        const start = Date.now();
        await client.connect();
        await client.ping();
        checks.redis = { status: 'ok', latencyMs: Date.now() - start };
      } catch {
        checks.redis = { status: 'down' };
      } finally {
        void client.quit();
      }
    }

    // RabbitMQ check
    const rabbitUrl = (env.get('RABBITMQ_URL') || '').trim();
    if (rabbitUrl) {
      try {
        const start = Date.now();
        const connection = await amqplib.connect(rabbitUrl, {
          timeout: 2000,
        });
        await connection.close();
        checks.rabbitmq = { status: 'ok', latencyMs: Date.now() - start };
      } catch {
        checks.rabbitmq = { status: 'down' };
      }
    }

    const allHealthy =
      checks.database.status === 'ok' &&
      (checks.redis.status === 'ok' ||
        checks.redis.status === 'not_configured') &&
      (checks.rabbitmq.status === 'ok' ||
        checks.rabbitmq.status === 'not_configured');
    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async ready({ response }: HttpContext) {
    const health = await this.check();
    return response
      .status(health.status === 'ok' ? 200 : 503)
      .json({ status: health.status === 'ok' ? 'ready' : 'not_ready' });
  }

  live({ response }: HttpContext) {
    return response.status(200).json({ status: 'alive' });
  }
}
