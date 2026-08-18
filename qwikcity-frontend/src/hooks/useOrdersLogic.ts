import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import {
  getOrders,
  getOpenOrders,
  getCancelledOrders,
  cancelOrder,
  createOrderIssue,
} from "~/lib/api/order";
import { toast } from "~/lib/toast";

export interface OrdersLogicStore {
  tab: "all" | "open" | "cancelled";
  loading: boolean;
  items: OrderLine[];
  error: string;
}

export interface OrderLine {
  id: string | number;
  createdAt?: string;
  status?: string;
  total?: number;
  items?: { name?: string; quantity?: number; price?: number }[];
}

function normalizeOrders(data: unknown): OrderLine[] {
  if (Array.isArray(data)) return data as OrderLine[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { orders?: unknown }).orders)
  ) {
    return (data as { orders: OrderLine[] }).orders;
  }
  return [];
}

export const useOrdersLogic = () => {
  const state = useStore<{
    tab: "all" | "open" | "cancelled";
    loading: boolean;
    items: OrderLine[];
    error: string;
  }>({
    tab: "all",
    loading: false,
    items: [],
    error: "",
  });

  const refresh = $(async () => {
    state.loading = true;
    try {
      let data: unknown;
      if (state.tab === "open") data = await getOpenOrders();
      else if (state.tab === "cancelled") data = await getCancelledOrders();
      else data = await getOrders();
      state.items = normalizeOrders(data);
      state.error = "";
    } catch (err) {
      state.error = err instanceof Error ? err.message : "Could not load orders";
      state.items = [];
    } finally {
      state.loading = false;
    }
  });

  const setTab = $((tab: "all" | "open" | "cancelled") => {
    state.tab = tab;
  });

  const handleCancel = $(async (orderId: string | number) => {
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  });

  const handleSupport = $(async (orderId: string | number, message: string) => {
    if (!message.trim()) return;
    try {
      await createOrderIssue(orderId, { message });
      toast.success("Support ticket created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    }
  });

  useTask$(async ({ track }) => {
    track(() => state.tab);
    await refresh();
  });

  return {
    ...state,
    refresh,
    setTab,
    handleCancel,
    handleSupport,
  };
};
