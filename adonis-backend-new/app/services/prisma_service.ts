import { PrismaClient } from '@prisma/client';
import env from '#start/env';

export default class PrismaService {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log:
        env.get('NODE_ENV') === 'development'
          ? ['query', 'error', 'warn']
          : ['error', 'warn'],
    });
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async connect(logger?: any): Promise<void> {
    try {
      await this.client.$connect();
      logger?.info?.('Prisma client connected');
    } catch (error) {
      logger?.error?.(
        { message: (error as Error).message },
        'Prisma connection failed',
      );
      throw error;
    }
  }

  async disconnect(logger?: any): Promise<void> {
    await this.client.$disconnect();
    logger?.info?.('Prisma client disconnected');
  }
}
