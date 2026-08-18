import { component$, Slot, useStore, useContext, useContextProvider, useVisibleTask$, $, type QRL } from "@builder.io/qwik";
import { createContextId } from "@builder.io/qwik";

type Theme = "light" | "dark";

export interface ThemeContextValue {
  store: { theme: Theme };
  toggleTheme: QRL<() => void>;
}

export const ThemeContext = createContextId<ThemeContextValue>("theme-context");

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  const cookie = getCookie("theme");
  if (cookie === "dark" || cookie === "light") return cookie;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const ThemeProvider = component$(() => {
  const store = useStore<{ theme: Theme }>({ theme: getInitialTheme() });

  useVisibleTask$(() => {
    const initial = getInitialTheme();
    store.theme = initial;
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  });

  const toggleTheme = $(() => {
    const next: Theme = store.theme === "light" ? "dark" : "light";
    store.theme = next;
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie =
      "theme=" + encodeURIComponent(next) + "; max-age=" + maxAge + "; path=/; SameSite=Lax";
  });

  useContextProvider(ThemeContext, { store, toggleTheme });

  return <Slot />;
});

export function useTheme() {
  const ctx = useContext(ThemeContext) as ThemeContextValue | undefined;
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  const localStore = useStore<{ theme: Theme }>({ theme: ctx.store.theme });
  return {
    get theme() {
      return localStore.theme;
    },
    toggleTheme: ctx.toggleTheme,
  };
}
