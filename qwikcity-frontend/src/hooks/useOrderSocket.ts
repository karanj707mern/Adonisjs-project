import { component$, useVisibleTask$, $ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import { getSiteUrl, SOCKET_BASE_URL } from "~/lib/config";

export interface OrderSocketOptions {
  url?: string;
  enabled?: boolean;
}

export interface OrderSocketStore {
  connected: boolean;
  viewerCount: number;
  liveStatuses: Record<string | number, string>;
}

export function useOrderSocket(
  opts: OrderSocketOptions = {},
): OrderSocketStore {
  const url = opts.url ?? SOCKET_BASE_URL ?? "";
  const enabled = opts.enabled ?? true;

  const store: OrderSocketStore = {
    connected: false,
    viewerCount: 0,
    liveStatuses: {},
  };

  useVisibleTask$(({ cleanup }) => {
    if (!enabled || typeof window === "undefined" || !url) {
      return;
    }

    let socket: { close: () => void; on: (e: string, fn: (...args: unknown[]) => void) => void } | null = null;

    const connect = async () => {
      try {
        const mod = await import("socket.io-client");
        const io = mod.io ?? mod.default;
        socket = io(url, {
          transports: ["websocket", "polling"],
          autoConnect: true,
          reconnection: true,
        });

        socket.on("connect", () => {
          store.connected = true;
        });

        socket.on("disconnect", () => {
          store.connected = false;
        });

        socket.on("order-status", ((payload: { orderId?: string | number; status?: string }) => {
          if (payload?.orderId != null && payload?.status) {
            store.liveStatuses[payload.orderId] = payload.status;
          }
        }) as (...args: unknown[]) => void);

        socket.on("viewer-count", ((count: number) => {
          store.viewerCount = count;
        }) as (...args: unknown[]) => void);
      } catch {
        // socket.io-client is an optional enhancement; failures are silent.
      }
    };

    connect();

    cleanup(() => {
      try {
        socket?.close();
      } catch {
        // ignore
      }
      store.connected = false;
      store.viewerCount = 0;
    });
  });

  return store;
}
