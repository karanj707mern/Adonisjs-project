import type { PrismaClient } from '@prisma/client'
import type BullMqService from '#controllers/notification/notification_queue'
import type NotificationService from '#controllers/notification/notification_service'
import type RabbitMqService from '#controllers/notification/rabbitmq_service'
import type { Server as SocketIOServer } from 'socket.io'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    Prisma: PrismaClient
    RedisCache: any
    Storage: any
    BullMqService: BullMqService
    RabbitMqService: RabbitMqService
    NotificationService: NotificationService
    SocketIO: SocketIOServer
  }
}
