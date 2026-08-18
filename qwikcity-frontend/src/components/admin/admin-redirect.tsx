import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getProfile } from "~/lib/api/auth";
import { useCurrentUser, setCurrentUser, markAuthChecked, getAuthChecked } from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";
import { toast } from "~/lib/toast";

const STORAGE_KEY = "adminPreviewMode";

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export default component$(() => {
  const userStore = useCurrentUser();
  const nav = useNavigate();
  const status = useSignal<"loading" | "ok" | "denied">("loading");

  const redirectToAuth = $(async (message?: string) => {
    await signOutCurrentUser();
    if (message) {
      toast.info(message);
    }
    nav("/auth?from=" + encodeURIComponent("/admin"));
  });

  useVisibleTask$(async () => {
    if (!getAuthChecked()) {
      markAuthChecked();
    }

    const userData = userStore.user as { id?: string | number; role?: string } | null;
    if (!userData?.id) {
      status.value = "ok";
      return;
    }

    const isPreviewMode = typeof window !== "undefined" && window.localStorage.getItem("adminPreviewMode") === "true";
    if (isPreviewMode) {
      status.value = "ok";
      return;
    }

    try {
      const data = await getProfile();
      const profileData = data as { user: Record<string, unknown> };
      setCurrentUser(profileData.user);

      if (profileData.user?.role === "ADMIN") {
        status.value = "denied";
        return;
      }

      status.value = "ok";
    } catch {
      await redirectToAuth();
    }
  });

  useVisibleTask$(({ cleanup }) => {
    const check = $(() => {
      if (status.value === "denied") {
        nav("/admin?orderMessage=" + encodeURIComponent("Admin accounts manage customer queues from the dashboard."));
      }
    });
    const timer = setInterval(check, 100);
    cleanup(() => clearInterval(timer));
  });

  if (status.value === "loading" || status.value === "denied") {
    return null;
  }

  return null;
});
