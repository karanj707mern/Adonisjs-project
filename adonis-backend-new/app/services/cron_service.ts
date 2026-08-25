import { inject } from '@adonisjs/fold';
import AbandonedCartService from '#services/abandoned_cart_service';
import cron from 'node-cron';

@inject()
export default class CronService {
  constructor(private abandonedCartService: AbandonedCartService) {}

  start() {
    cron.schedule(
      '0 0 * * *',
      // @ts-ignore node-cron types don't include timezone in this version
      { timezone: 'Asia/Kolkata' },
      async () => {
        console.info('Starting abandoned cart cleanup job');
        try {
          await this.abandonedCartService.cleanupExpired();
          console.info('Abandoned cart cleanup completed');
        } catch (error) {
          console.error(
            `Abandoned cart cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    console.info('Cron jobs started');
  }
}
