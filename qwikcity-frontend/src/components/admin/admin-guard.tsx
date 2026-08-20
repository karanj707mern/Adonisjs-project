import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { getProfile } from "~/lib/api/auth";
import {
  useCurrentUser,
  setCurrentUser,
  markAuthChecked,
  getAuthChecked,
} from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";
import { toast } from "~/lib/toast";

function AdminLoadingState() {
  return (
    <div class="flex min-h-[60vh] w-full items-center justify-center">
      <div class="flex flex-col items-center gap-4 text-slate-500">
        <span class="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
        <p class="text-sm">Verifying admin access…</p>
      </div>
    </div>
  );
}

function AdminAccessDenied() {
  const nav = useNavigate();
  return (
    <div class="flex min-h-[60vh] w-full items-center justify-center">
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700 dark:text-red-300">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-8 w-8"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 class="font-serif text-2xl text-slate-900 dark:text-slate-100">
          Access Denied
        </h1>
        <p class="max-w-md text-sm text-slate-600 dark:text-slate-400">
          You need admin privileges to access this area. If you believe this is
          an error, please contact support.
        </p>
        <button
          type="button"
          onClick$={() => nav("/")}
          class="btn-primary mt-4"
        >
          Back to Store
        </button>
      </div>
    </div>
  );
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

    const userData = userStore.user as {
      id?: string | number;
      role?: string;
    } | null;
    if (!userData?.id) {
      await redirectToAuth("Sign in as admin to access the dashboard.");
      return;
    }

    try {
      const data = await getProfile();
      const profileData = data as { user: Record<string, unknown> };
      setCurrentUser(profileData.user);

      if (profileData.user?.role !== "ADMIN") {
        status.value = "denied";
        return;
      }

      status.value = "ok";
    } catch {
      await redirectToAuth();
    }
  });

  if (status.value === "loading") {
    return <AdminLoadingState />;
  }

  if (status.value === "denied") {
    return <AdminAccessDenied />;
  }

  return <slot />;
});
