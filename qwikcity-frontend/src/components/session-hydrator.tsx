import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { getSession } from "~/lib/api/auth";
import {
  clearToken,
  markAuthChecked,
  setCurrentUser,
  wasRecentlyLoggedOut,
} from "~/lib/storage";
import { setStoredCsrfToken } from "~/lib/api/http";

const hydrateUser = $(async () => {
  try {
    if (wasRecentlyLoggedOut()) {
      clearToken();
      markAuthChecked();
      return;
    }

    let timedOut = false;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve(true);
      }, 10000);
    });

    const data = (await Promise.race([
      getSession(),
      timeoutPromise,
    ])) as {
      authenticated: boolean;
      user?: Record<string, unknown>;
      csrfToken?: string | null;
    };

    if (timedOut) {
      markAuthChecked();
      return;
    }

    if (data.csrfToken) {
      setStoredCsrfToken(data.csrfToken);
    }

    if (data.authenticated && data.user) {
      setCurrentUser(data.user);
      return;
    }

    clearToken();
  } catch {
    clearToken();
  } finally {
    markAuthChecked();
  }
});

export const SessionHydrator = component$(() => {
  useVisibleTask$(async () => {
    await hydrateUser();
  });

  return null;
});
