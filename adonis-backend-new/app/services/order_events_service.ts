import type { PrismaClient } from '@prisma/client';
import RedisCacheService from '#services/redis_cache_service';
import type { Product } from '@prisma/client';

export type OrderStreamMessage =
  | { type: 'connected'; order: null }
  | { type: 'order.updated'; order: unknown };

export default class OrderEventsService {
  private static readonly adminCacheKey = 'orders:events:admin:last';

  private readonly userStreams = new Map<
    number,
    ((message: OrderStreamMessage) => void)[]
  >();
  private readonly adminStream: ((message: OrderStreamMessage) => void)[] = [];
  private readonly orderUpdatesStream: ((message: {
    userId: number;
    message: OrderStreamMessage;
  }) => void)[] = [];

  constructor(
    private prisma: PrismaClient,
    private cache: RedisCacheService,
  ) {}

  subscribe(userId: number, callback: (message: OrderStreamMessage) => void) {
    const listeners = this.userStreams.get(userId) ?? [];
    listeners.push(callback);
    this.userStreams.set(userId, listeners);

    callback({ type: 'connected', order: null });

    return () => {
      const current = this.userStreams.get(userId) ?? [];
      const filtered = current.filter((fn) => fn !== callback);
      if (filtered.length === 0) {
        this.userStreams.delete(userId);
      } else {
        this.userStreams.set(userId, filtered);
      }
    };
  }

  subscribeAdmin(callback: (message: OrderStreamMessage) => void) {
    this.adminStream.push(callback);
    callback({ type: 'connected', order: null });
    return () => {
      const idx = this.adminStream.indexOf(callback);
      if (idx !== -1) this.adminStream.splice(idx, 1);
    };
  }

  subscribeOrderUpdates(
    callback: (message: {
      userId: number;
      message: OrderStreamMessage;
    }) => void,
  ) {
    this.orderUpdatesStream.push(callback);
    return () => {
      const idx = this.orderUpdatesStream.indexOf(callback);
      if (idx !== -1) this.orderUpdatesStream.splice(idx, 1);
    };
  }

  emitOrderUpdated(userId: number, order: unknown) {
    const message: OrderStreamMessage = { type: 'order.updated', order };

    const userListeners = this.userStreams.get(userId) ?? [];
    userListeners.forEach((fn) => {
      try {
        fn(message);
      } catch {
        /* ignore */
      }
    });

    this.adminStream.forEach((fn) => {
      try {
        fn(message);
      } catch {
        /* ignore */
      }
    });

    this.orderUpdatesStream.forEach((fn) => {
      try {
        fn({ userId, message });
      } catch {
        /* ignore */
      }
    });

    void this.cacheLastOrderEvent(userId, message).catch(() => undefined);
  }

  getLastOrderEvent(userId: number) {
    return this.cache.getJson<OrderStreamMessage>(
      `orders:events:user:${userId}:last`,
    );
  }

  getLastAdminOrderEvent() {
    return this.cache.getJson<OrderStreamMessage>(
      OrderEventsService.adminCacheKey,
    );
  }

  private async cacheLastOrderEvent(
    userId: number,
    message: OrderStreamMessage,
  ) {
    await Promise.all([
      this.cache.setJson(`orders:events:user:${userId}:last`, message),
      this.cache.setJson(OrderEventsService.adminCacheKey, message),
    ]);
  }
}
