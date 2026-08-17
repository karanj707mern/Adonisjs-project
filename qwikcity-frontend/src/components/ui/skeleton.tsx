import { component$ } from "@builder.io/qwik";

export const Skeleton = component$<{ class?: string }>(({ class: klass }) => {
  return <div class={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${klass ?? ""}`} />;
});

export const ProductGridSkeleton = component$(() => {
  return (
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} class="card overflow-hidden">
          <Skeleton class="aspect-square w-full rounded-none" />
          <div class="space-y-2 p-4">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
});

export const Spinner = component$(() => {
  return (
    <div class="flex items-center justify-center py-16">
      <svg class="h-8 w-8 animate-spin text-neon" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
    </div>
  );
});
