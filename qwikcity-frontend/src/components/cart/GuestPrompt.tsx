import { component$ } from "@builder.io/qwik";

interface GuestPromptProps {
  onSignIn$: () => void;
}

export const GuestPrompt = component$(({ onSignIn$ }: GuestPromptProps) => {
  return (
    <div class="mb-8 rounded-[2rem] border border-[var(--success-border)] bg-[var(--success-bg)] p-6 shadow-sm card">
      <div class="space-y-2 text-center">
        <p class="text-base font-medium text-[var(--success-text)]">
          You are viewing your cart as a guest.
        </p>
        <p class="text-sm text-[var(--success-text)]">
          Sign in to preserve your cart, unlock free shipping offers, save
          addresses, and checkout in one tap.
        </p>
      </div>
      <div class="mt-4 text-center">
        <button type="button" onClick$={onSignIn$} class="btn-primary">
          Sign in to preserve cart
        </button>
      </div>
    </div>
  );
});
