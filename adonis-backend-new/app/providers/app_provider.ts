import { inject } from '@adonisjs/fold';
import type { ApplicationService } from '@adonisjs/core/types';
import NotificationService from '#controllers/notification/notification_service';
import BullMqService from '#controllers/notification/notification_queue';
import RabbitMqService from '#controllers/notification/rabbitmq_service';
import CronService from '#services/cron_service';
import PrismaService from '#services/prisma_service';
import RedisCacheService from '#services/redis_cache_service';
import type { PrismaClient } from '@prisma/client';
import AbandonedCartService from '#services/abandoned_cart_service';
import { initSentry } from '#lib/sentry';

@inject()
export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    const container = this.app.container;

    container.singleton(BullMqService, () => new BullMqService());

    container.singleton(RabbitMqService, () => new RabbitMqService());

    container.singleton(NotificationService, async () => {
      const db = (await container.make('Database')) as PrismaClient;
      return new NotificationService(db, await container.make(BullMqService));
    });

    container.singleton(CronService, async () => {
      return new CronService(await container.make(AbandonedCartService));
    });
  }

  async boot() {
    initSentry();

    const rabbitMq = await this.app.container.make(RabbitMqService);
    await rabbitMq.connect();

    const notificationService =
      await this.app.container.make(NotificationService);
    notificationService.startProcessing();

    // CronService schedules jobs in its constructor
    await this.app.container.make(CronService);
  }

  /** Graceful shutdown — close all connections to prevent leaks */
  async shutdown() {
    try {
      const bullMq = await this.app.container.make(BullMqService);
      await bullMq.close();
    } catch {
      /* ignore */
    }

    try {
      const rabbitMq = await this.app.container.make(RabbitMqService);
      await rabbitMq.disconnect();
    } catch {
      /* ignore */
    }

    try {
      const prisma = await this.app.container.make(PrismaService);
      await prisma.disconnect();
    } catch {
      /* ignore */
    }

    try {
      const redis = await this.app.container.make(RedisCacheService);
      await redis.destroy();
    } catch {
      /* ignore */
    }
  }
}
