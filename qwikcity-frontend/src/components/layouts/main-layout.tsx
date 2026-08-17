import { component$, Slot } from "@builder.io/qwik";
import { Header } from "~/components/site/header";
import { Footer } from "~/components/site/footer";

export const MainLayout = component$(() => {
  return (
    <div class="flex min-h-screen flex-col">
      <Header />
      <main class="flex-1">
        <Slot />
      </main>
      <Footer />
    </div>
  );
});
