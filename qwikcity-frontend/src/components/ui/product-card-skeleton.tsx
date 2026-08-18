import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export const ProductCardSkeleton = component$(() => {
  return (
    <div class="overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm card">
      <div class="skeleton h-60 w-full rounded-none" />
      <div class="p-6">
        <div class="skeleton variant-text h-4 w-2/5 rounded" />
        <div class="skeleton variant-text mt-2 h-6 w-[90%] rounded" />
        <div class="skeleton variant-text mt-2 h-10 w-full rounded" />
        <div class="mt-auto flex items-center gap-2 pt-4">
          <div class="skeleton variant-rounded h-7 w-20 shrink-0 rounded" />
          <div class="skeleton variant-rounded ml-auto h-9 w-9 shrink-0 rounded" />
          <div class="skeleton variant-rounded flex-1 h-10 rounded" />
        </div>
      </div>
    </div>
  );
});
