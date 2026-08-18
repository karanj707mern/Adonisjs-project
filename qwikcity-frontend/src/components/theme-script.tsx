import { component$ } from "@builder.io/qwik";

export const ThemeScript = component$(() => {
  return (
    <script
      dangerouslySetInnerHTML={`
        (function () {
          try {
            var cookieMatch = document.cookie.match(/(?:^|; )theme=([^;]*)/);
            var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
            var stored = cookieTheme || (typeof window !== 'undefined' ? localStorage.getItem('theme') : null);
            var prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
            var dark = stored ? stored === 'dark' : prefersDark;
            if (dark === true || dark === 'true') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
          } catch (e) {}
        })();
      `}
    />
  );
});
