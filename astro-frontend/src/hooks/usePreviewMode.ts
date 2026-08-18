"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "../hooks/useNavigate";
import useSearchParams from "../hooks/useSearchParams";

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
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const [previewMode, setPreviewMode] = useState(() => readStorage());

  useEffect(() => {
    const urlPreview = searchParams.get("preview") === "true";
    const storagePreview = readStorage();

    if (urlPreview !== storagePreview) {
      writeStorage(urlPreview);
      setPreviewMode(urlPreview);
    }
  }, [searchParams]);

  const enablePreview = useCallback(
    (href: string) => {
      writeStorage(true);
      setPreviewMode(true);
      navigate(href);
    },
    [navigate],
  );

  const disablePreview = useCallback(
    (href: string) => {
      writeStorage(false);
      setPreviewMode(false);
      navigate(href);
    },
    [navigate],
  );

  return {
    previewMode,
    enablePreview,
    disablePreview,
  };
}
