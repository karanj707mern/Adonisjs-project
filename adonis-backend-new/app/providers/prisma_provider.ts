import { inject } from '@adonisjs/fold';
import type { ApplicationService } from '@adonisjs/core/types';
import type { PrismaClient } from '@prisma/client';
import PrismaService from '#services/prisma_service';
import type { Server } from 'socket.io';
import SocketNotifier from '#services/socket_notifier';

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    Database: PrismaClient;
    SocketIO: Server;
    SocketNotifier: SocketNotifier;
  }
}

@inject()
export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(PrismaService, () => new PrismaService());
    this.app.container.singleton('Database', async () => {
      const service = await this.app.container.make(PrismaService);
      return service.getClient();
    });
  }

  async boot() {
    const prisma = await this.app.container.make('Database');
    try {
      await prisma.$connect();
      console.info('Prisma database connection established');
    } catch (error) {
      console.warn(
        { message: (error as Error).message },
        'Prisma connection check failed',
      );
    }
  }

  async shutdown() {
    const prisma = await this.app.container.make('Database');
    try {
      await prisma.$disconnect();
      console.info('Prisma client disconnected');
    } catch (error) {
      console.warn(
        { message: (error as Error).message },
        'Prisma disconnect failed',
      );
    }
  }
}
