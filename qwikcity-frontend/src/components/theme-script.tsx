import { component$ } from "@builder.io/qwik";

/**
 * Sets the `dark` class on <html> before first paint to avoid a flash of the
 * wrong theme. Mirrors the ThemeScript used by the other Moringa frontends.
 */
export const ThemeScript = component$(() => {
  return (
    <script
      dangerouslySetInnerHTML={`
        (function () {
          try {
            var stored = localStorage.getItem('theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var dark = stored ? stored === 'dark' : prefersDark;
            document.documentElement.classList.toggle('dark', dark);
          } catch (e) {}
        })();
      `}
    />
  );
});
