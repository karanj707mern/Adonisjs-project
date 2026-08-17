import {
  component$,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { TOAST_EVENT_NAME, type ToastMessage } from "~/lib/toast";

const VARIANT_CLASSES: Record<string, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100",
  error: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100",
  info: "border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  loading: "border-neon-dim bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
};

export const Toaster = component$(() => {
  const state = useStore<{ items: ToastMessage[] }>({ items: [] });

  useVisibleTask$(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastMessage>).detail;
      state.items = [...state.items, detail];
      const ttl = detail.variant === "loading" ? 4000 : 3500;
      setTimeout(() => {
        state.items = state.items.filter((item) => item.id !== detail.id);
      }, ttl);
    };
    window.addEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    };
  });

  return (
    <div class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {state.items.map((item) => (
        <div
          key={item.id}
          class={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-card ${
            VARIANT_CLASSES[item.variant] ?? VARIANT_CLASSES.info
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
});
