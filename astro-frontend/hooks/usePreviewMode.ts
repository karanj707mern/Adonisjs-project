"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "adminPreviewMode";

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function writeStorage(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
}

export function usePreviewMode() {
  const [previewMode, setPreviewMode] = useState(() => readStorage());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPreview = params.get("preview") === "true";
    const storagePreview = readStorage();

    if (urlPreview !== storagePreview) {
      writeStorage(urlPreview);
      setPreviewMode(urlPreview);
    }
  }, []);

  const enablePreview = useCallback(
    (href: string) => {
      writeStorage(true);
      setPreviewMode(true);
      window.location.href = href;
    },
    [],
  );

  const disablePreview = useCallback(
    (href: string) => {
      writeStorage(false);
      setPreviewMode(false);
      window.location.href = href;
    },
    [],
  );

  return {
    previewMode,
    enablePreview,
    disablePreview,
  };
}
