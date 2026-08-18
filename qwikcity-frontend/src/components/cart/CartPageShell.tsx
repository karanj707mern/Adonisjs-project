import { component$, Slot } from "@builder.io/qwik";

interface CartPageShellProps {
  children?: unknown;
}

export const CartPageShell = component$(({ children }: CartPageShellProps) => {
  return (
    <div class="min-h-screen bg-[var(--bg-primary)] pb-24 text-[var(--text-primary)] theme-transition">
      <main>{children as any}</main>
    </div>
  );
});
