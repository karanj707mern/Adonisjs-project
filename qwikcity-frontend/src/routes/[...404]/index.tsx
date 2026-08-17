import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <div class="container-page flex flex-col items-center justify-center py-24 text-center">
      <p class="text-6xl font-extrabold text-neon">404</p>
      <h1 class="mt-4 text-2xl font-bold">Page not found</h1>
      <p class="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <a href="/" class="btn-primary mt-6">Back home</a>
    </div>
  );
});
