/**
 * Prisma Service — AdonisJS v7
 *
 * Uses @prisma/adapter-pg with connection pooling for production-grade
 * database performance. Ported from Moringa-Backend (NestJS).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { inject } from '@adonisjs/fold';
import env from '#start/env';
import logger from '@adonisjs/core/services/logger';

@inject()
export default class PrismaService {
  private client: PrismaClient;

  constructor() {
    const connectionString = env.get('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const isProduction = env.get('NODE_ENV') === 'production';

    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
      keepAlive: true,
      // Kill queries that run longer than 15s (prevents connection pile-ups)
      statement_timeout: 15000,
      query_timeout: 15000,
      // Enforce TLS to the database in production (MITM protection)
      ...(isProduction && !connectionString.includes('sslmode=')
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    });

    const adapter = new PrismaPg(pool);

    this.client = new PrismaClient({
      adapter,
      log:
        env.get('NODE_ENV') === 'development'
          ? ['query', 'error', 'warn']
          : ['error', 'warn'],
    });

    (this.client as any).$on('query', (e: any) => {
      logger.debug(
        { query: e.query, duration: `${e.duration}ms` },
        'Prisma query',
      );
    });

    (this.client as any).$on('error', (e: any) => {
      logger.error({ message: e.message }, 'Prisma error');
    });
  }

  getClient(): PrismaClient {
    return this.client;
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('Prisma client connected (pg adapter + pool)');
    } catch (error) {
      logger.error(
        { message: (error as Error).message },
        'Prisma connection failed',
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
    logger.info('Prisma client disconnected');
  }
}
