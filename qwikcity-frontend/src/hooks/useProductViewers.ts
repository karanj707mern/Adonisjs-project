import { useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import { SOCKET_BASE_URL } from "../lib/config";

export interface ProductViewersState {
  viewers: Signal<number>;
  connected: Signal<boolean>;
  error: Signal<string | null>;
}

export function useProductViewers(productId: string | number | null) {
  const viewers = useSignal(0);
  const connected = useSignal(false);
  const error = useSignal<string | null>(null);

  useVisibleTask$(async ({ cleanup }) => {
    if (!productId || typeof window === "undefined") {
      return;
    }

    const pid = typeof productId === "string" ? Number(productId) : productId;
    if (!pid || pid <= 0) {
      return;
    }

    let socket: {
      disconnect: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      emit: (event: string, data: unknown) => void;
    } | null = null;

    try {
      const { io } = await import("socket.io-client");

      const token = getAccessToken();

      socket = io(`${SOCKET_BASE_URL}/products`, {
        path: "/socket.io",
        auth: token ? { token } : {},
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

      socket.on("connect", () => {
        connected.value = true;
        error.value = null;
        socket!.emit("product:view", { productId: pid });
      });

      socket.on("disconnect", () => {
        connected.value = false;
      });

      socket.on("connect_error", () => {
        connected.value = false;
        error.value = "Failed to connect to live viewers.";
      });

      socket.on("product:viewers", (message: unknown) => {
        const msg = message as { productId: number; viewers: number };
        if (msg.productId === pid) {
          viewers.value = msg.viewers;
        }
      });

      socket.on("error", (data: unknown) => {
        const errData = data as { message?: string };
        error.value = errData.message ?? "Unknown socket error.";
      });
    } catch {
      error.value = "Live viewers unavailable.";
    }

    cleanup(() => {
      if (socket) {
        socket.disconnect();
      }
    });
  });

  return {
    viewers,
    connected,
    error,
  };
}

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
