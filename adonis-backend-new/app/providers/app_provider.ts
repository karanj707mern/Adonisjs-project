import type { ApplicationService } from '@adonisjs/core/types';
import NotificationService from '#controllers/notification/notification_service';
import BullMqService from '#controllers/notification/notification_queue';
import RabbitMqService from '#controllers/notification/rabbitmq_service';

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    this.app.container.singleton('BullMqService', () => new BullMqService())
    this.app.container.singleton(
      'RabbitMqService',
      () => new RabbitMqService(),
    )
    this.app.container.singleton(
      'NotificationService',
      () =>
        new NotificationService(
          this.app.container.make('Database'),
          this.app.container.make('BullMqService'),
        ),
    )

    const rabbitMq = this.app.container.make(
      'RabbitMqService',
    ) as RabbitMqService;
    await rabbitMq.connect();

    const notificationService = this.app.container.make(
      'NotificationService',
    ) as NotificationService;
    notificationService.startProcessing();
  }
}
