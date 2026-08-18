"use client";

import { useContext } from "react";
import { toast } from "sonner";
import { ToastContext } from "../components/ToastContext";

function showToast({
  severity = "info",
  summary = "",
  detail = "",
  life = 4000,
}: {
  severity?: string;
  summary?: string;
  detail?: string;
  life?: number;
} = {}) {
  const message = summary
    ? detail
      ? `${summary}: ${detail}`
      : summary
    : detail;
  const duration = Number.isFinite(life) ? life : 4000;

  if (severity === "success") {
    toast.success(message || "Saved.", { duration });
    return;
  }
  if (severity === "error") {
    toast.error(message || "Something went wrong.", { duration });
    return;
  }
  if (severity === "warning") {
    toast.warning(message || "Please check.", { duration });
    return;
  }
  toast(message || "Notification.", { duration });
}

export function useToast(): {
  showToast: (opts: {
    severity?: string;
    summary?: string;
    detail?: string;
    life?: number;
  }) => void;
} {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast };
  }
  return context;
}
