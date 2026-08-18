import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

export default class RequestContextService {
  private readonly store = requestContextStore;

  run<T>(context: RequestContext, callback: () => T): T {
    return this.store.run(context, callback);
  }

  getContext(): RequestContext | undefined {
    return this.store.getStore();
  }

  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }

  getUserId(): number | undefined {
    return this.getContext()?.userId;
  }

  getIp(): string | undefined {
    return this.getContext()?.ip;
  }

  getUserAgent(): string | undefined {
    return this.getContext()?.userAgent;
  }
}
