import { component$, Slot } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { MainNavbar } from "~/components/site/main-navbar";
import { Footer } from "~/components/site/footer";
import { GoToTop } from "~/components/gototop";

export const MainLayout = component$(() => {
  const loc = useLocation();
  const hideSiteChrome = loc.url.pathname === "/";

  return (
    <div class="flex min-h-screen flex-col">
      {!hideSiteChrome && <MainNavbar />}
      <main id="main-content" class="flex-1">
        <Slot />
      </main>
      {!hideSiteChrome && <Footer />}
      <GoToTop />
    </div>
  );
});
