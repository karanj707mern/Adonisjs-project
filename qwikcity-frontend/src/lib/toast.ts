export type ToastVariant = "success" | "error" | "info" | "loading";

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

const TOAST_EVENT = "moringa:toast";

function emit(message: string, variant: ToastVariant): void {
  if (typeof window === "undefined") return;
  const payload: ToastMessage = {
    id: Date.now() + Math.random(),
    message,
    variant,
  };
  window.dispatchEvent(
    new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: payload }),
  );
}

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
  loading: (message: string) => emit(message, "loading"),
};

export const TOAST_EVENT_NAME = TOAST_EVENT;
