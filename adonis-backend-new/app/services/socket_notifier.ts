import type { Server as SocketIOServer, Socket } from 'socket.io';

type ViewerKey = `${number}`;

export default class SocketNotifier {
  private readonly productViewers = new Map<ViewerKey, Set<string>>();
  private io: SocketIOServer | null = null;

  setIo(io: SocketIOServer) {
    this.io = io;
  }

  registerProductNamespace() {
    if (!this.io) return;

    const productNamespace = this.io.of('/product');

    productNamespace.on('connection', (socket: Socket) => {
      socket.on('product:view', (payload: { productId?: number }) => {
        const productId = Number(payload?.productId);
        if (!Number.isFinite(productId) || productId <= 0) return;

        const key = String(productId);
        const viewers = this.productViewers.get(key) ?? new Set<string>();
        viewers.add(socket.id);
        this.productViewers.set(key, viewers);

        this.emitProductViewers(productId);
      });

      socket.on('disconnect', () => {
        for (const [key, viewers] of this.productViewers.entries()) {
          if (viewers.delete(socket.id)) {
            if (viewers.size === 0) {
              this.productViewers.delete(key);
            } else {
              const productId = Number(key);
              if (Number.isFinite(productId) && productId > 0) {
                this.emitProductViewers(productId);
              }
            }
          }
        }
      });
    });
  }

  emitOrderUpdated(order: Record<string, unknown>) {
    if (!this.io) return;
    try {
      this.io.emit('order.updated', { type: 'order.updated', order });
    } catch {
      // ignore socket emit failures
    }
  }

  private emitProductViewers(productId: number) {
    if (!this.io) return;
    const viewers = this.productViewers.get(String(productId));
    const count = viewers ? viewers.size : 0;
    try {
      this.io.of('/product').emit('product:viewers', {
        type: 'product:viewers',
        productId,
        viewers: count,
      });
    } catch {
      // ignore socket emit failures
    }
  }
}
