"use client";

import { useToast } from "../../hooks/useToast";
import { getProfile } from "../../lib/api/auth";
import {
  clearToken,
  setCurrentUser,
  useAuthChecked,
  useCurrentUser,
} from "../../lib/storage";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "../../hooks/useNavigate";

const STORAGE_KEY = "adminPreviewMode";

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export default function AdminRedirect() {
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = useCurrentUser() as Record<string, unknown> | null;
  const authChecked = useAuthChecked();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  const redirectToAuth = useCallback(
    (message?: string) => {
      clearToken();
      if (message) {
        toast.showToast({
          severity: "info",
          summary: "Session expired",
          detail: message,
          life: 4000,
        });
      }
      const target = "/auth?from=" + encodeURIComponent("/admin");
      if (typeof window !== "undefined") {
        window.location.href = target;
      } else {
        navigate(target);
      }
    },
    [navigate, toast],
  );

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!currentUser?.id) {
      setStatus("ok");
      return;
    }

    const isPreviewMode = readStorage();

    if (isPreviewMode) {
      setStatus("ok");
      return;
    }

    let cancelled = false;

    getProfile()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const profileData = data as { user: Record<string, unknown> };
        setCurrentUser(profileData.user);

        if (profileData.user?.role === "ADMIN") {
          setStatus("denied");
          return;
        }

        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) {
          redirectToAuth();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authChecked, currentUser?.id, redirectToAuth, navigate, toast]);

  useEffect(() => {
    if (status === "denied") {
      navigate(
        "/admin?orderMessage=" +
          encodeURIComponent(
            "Admin accounts manage customer queues from the dashboard.",
          ),
      );
    }
  }, [status, navigate]);

  if (status === "loading") {
    return null;
  }

  if (status === "denied") {
    return null;
  }

  return null;
}
