import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export const ErrorBoundary = component$((props: {
  fallback?: any;
  children: any;
}) => {
  const hasError = useSignal(false);
  const error = useSignal<Error | null>(null);

  useVisibleTask$(({ cleanup }) => {
    const handler = (event: ErrorEvent) => {
      hasError.value = true;
      error.value = event.error ?? new Error(event.message);
    };
    window.addEventListener("error", handler as EventListener);
    window.addEventListener("unhandledrejection", (event) => {
      hasError.value = true;
      error.value = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    });
    return cleanup(() => {
      window.removeEventListener("error", handler as EventListener);
    });
  });

  if (hasError.value) {
    if (props.fallback) {
      return props.fallback;
    }

    return (
      <div class="flex min-h-[50vh] items-center justify-center px-4">
        <div class="max-w-md rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center shadow-sm">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-bg)]">
            <svg
              class="h-6 w-6 text-[var(--danger-text)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 class="font-serif text-2xl text-[var(--text-primary)]">
            Something went wrong
          </h2>
          <p class="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick$={() => {
              hasError.value = false;
              error.value = null;
              window.location.reload();
            }}
            class="btn-primary mt-6"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  return props.children;
});
