import { component$, Slot } from "@builder.io/qwik";
import { MainNavbar } from "~/components/site/main-navbar";
import { Footer } from "~/components/site/footer";
import { GoToTop } from "~/components/gototop";

export const MainLayout = component$(() => {
  return (
    <div class="flex min-h-screen flex-col">
      <MainNavbar />
      <main id="main-content" class="flex-1">
        <Slot />
      </main>
      <Footer />
      <GoToTop />
    </div>
  );
});
