import { component$, Slot } from "@builder.io/qwik";

export const InfoPage = component$<{ title: string; subtitle?: string }>(
  ({ title, subtitle }) => {
    return (
      <div class="container-page max-w-3xl py-10">
        <h1 class="text-3xl font-bold">{title}</h1>
        {subtitle ? <p class="mt-2 text-slate-500">{subtitle}</p> : null}
        <div class="mt-6 space-y-4 leading-relaxed text-slate-700 dark:text-slate-300">
          <Slot />
        </div>
      </div>
    );
  },
);
