"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "../hooks/useNavigate";

const STORAGE_KEY = "adminPreviewMode";

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function writeStorage(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
}

function useSearchParams() {
  const [params, setParams] = useState(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    const handler = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handler);
    window.addEventListener("astro:after-swap", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("astro:after-swap", handler);
    };
  }, []);

  return params;
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
