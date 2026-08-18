import type { ApplicationService } from '@adonisjs/core/types';
import { Server } from 'socket.io';
import type { HttpServer } from '@adonisjs/core/types';
import SocketNotifier from '#services/socket_notifier';
import RedisCacheService from '#services/redis_cache_service';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import env from '#start/env';

export default class WebsocketProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const httpServer = await this.app.container.make('server');
    const nodeServer = (httpServer as unknown as HttpServer).server;
    if (!nodeServer) return;
    const logger = await this.app.container.make('logger');

    const redisUrl = env.get('REDIS_URL') || '';
    let adapter: ReturnType<typeof createAdapter> | undefined;

    if (redisUrl) {
      try {
        const pubClient = new Redis(redisUrl, {
          lazyConnect: true,
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          retryStrategy: (times: number) => (times > 1 ? null : Math.min(times * 100, 3000)),
        });
        const subClient = pubClient.duplicate();

        pubClient.on('connect', () => console.info('Socket.IO Redis PUB client connected'));
        pubClient.on('ready', () => console.info('Socket.IO Redis PUB client ready'));
        pubClient.on('error', (err: Error) => console.error(`Socket.IO Redis PUB error: ${err.message}`));
        pubClient.on('close', () => console.warn('Socket.IO Redis PUB connection closed'));

        subClient.on('connect', () => console.info('Socket.IO Redis SUB client connected'));
        subClient.on('ready', () => console.info('Socket.IO Redis SUB client ready'));
        subClient.on('error', (err: Error) => console.error(`Socket.IO Redis SUB error: ${err.message}`));
        subClient.on('close', () => console.warn('Socket.IO Redis SUB connection closed'));

        await Promise.all([pubClient.connect(), subClient.connect()]);
        adapter = createAdapter(pubClient, subClient);
        console.info('Socket.IO Redis adapter initialized');
      } catch (error) {
        console.error(
          `Failed to initialize Socket.IO Redis adapter: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const io = new Server(nodeServer, {
      cors: { origin: '*', credentials: true },
      adapter,
    });

    const notifier = new SocketNotifier();
    notifier.setIo(io);
    notifier.registerProductNamespace();

    io.on('connection', (socket) => {
      socket.on('disconnect', () => {});
    });

    this.app.container.singleton('SocketIO', () => io);
    this.app.container.singleton('SocketNotifier', () => notifier);
    console.info('Socket.IO attached to HTTP server');
  }
}
