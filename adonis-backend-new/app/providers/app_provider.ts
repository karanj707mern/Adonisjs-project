import type { ApplicationService } from '@adonisjs/core/types'
import BullMqService from '#controllers/notification/notification_queue'
import RabbitMqService from '#controllers/notification/rabbitmq_service'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    this.app.container.singleton('BullMqService', () => new BullMqService())
    this.app.container.singleton('RabbitMqService', () => new RabbitMqService())
  }
}
