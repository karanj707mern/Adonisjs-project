import { injectable } from '@adonisjs/fold';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import env from '@adonisjs/core/services/env';
import logger from '@adonisjs/core/services/logger';

interface NotificationJobData {
  notificationId: number;
}

@injectable()
export default class BullMqService {
  private readonly queueName = 'notifications';
  private queue?: Queue;
  private worker?: Worker<NotificationJobData>;
  private handler?: (notificationId: number) => Promise<void>;
  private redisClient?: Redis;

  get isConfigured(): boolean {
    return Boolean(env.get('REDIS_URL'));
  }

  setHandler(handler: (notificationId: number) => Promise<void>): void {
    this.handler = handler;
  }

  async connect() {
    if (!this.isConfigured) {
      logger.warn(
        'BullMQ not configured. Notification delivery will use in-process queue.',
      );
      return;
    }
    const redisUrl = env.get('REDIS_URL') || '';
    const isProduction = env.get('NODE_ENV') === 'production';
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      ...(isProduction ? { tls: {} } : {}),
    });
    this.queue = new Queue(this.queueName, {
      connection: this.redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
    this.worker = new Worker(
      this.queueName,
      async (job: Job<NotificationJobData>) => {
        if (this.handler) await this.handler(job.data.notificationId);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
        limiter: { max: 10, duration: 1000 },
      },
    );
    this.worker.on('completed', (job) =>
      logger.log(`Notification job ${job.id} completed`),
    );
    this.worker.on('failed', (job, err) =>
      logger.error(
        `Notification job ${job?.id} failed`,
        err instanceof Error ? err.stack : err,
      ),
    );
    this.queue.on('error', (error) =>
      logger.error(
        'BullMQ queue error',
        error instanceof Error ? error.stack : String(error),
      ),
    );
    this.worker.on('error', (error) =>
      logger.error(
        'BullMQ worker error',
        error instanceof Error ? error.stack : String(error),
      ),
    );
    logger.log('BullMQ connected and worker started');
  }

  async close() {
    try {
      await this.worker?.close();
      await this.queue?.close();
      await this.redisClient?.quit();
    } catch (error) {
      logger.error(
        'Error closing BullMQ connection',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async addJob(notificationId: number): Promise<void> {
    if (!this.queue) return Promise.resolve();
    try {
      await this.queue.add('process', { notificationId });
    } catch (error) {
      logger.error(
        'Failed to add BullMQ job',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
