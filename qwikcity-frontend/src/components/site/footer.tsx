import { component$ } from "@builder.io/qwik";

export const Footer = component$(() => {
  const year = new Date().getFullYear();
  return (
    <footer class="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div class="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div class="flex items-center gap-2 text-lg font-bold">
            <span class="inline-block h-5 w-5 rounded-full bg-neon" />
            Moringa
          </div>
          <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Premium moringa products for a healthier you.
          </p>
        </div>

        <div>
          <h3 class="text-sm font-semibold">Shop</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="/shop" class="hover:text-neon">All Products</a></li>
            <li><a href="/gift-cards" class="hover:text-neon">Gift Cards</a></li>
            <li><a href="/new-arrivals" class="hover:text-neon">New Arrivals</a></li>
            <li><a href="/wishlist" class="hover:text-neon">Wishlist</a></li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold">Company</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="/about-us" class="hover:text-neon">About Us</a></li>
            <li><a href="/blog" class="hover:text-neon">Blog</a></li>
            <li><a href="/wellness-journal" class="hover:text-neon">Wellness Journal</a></li>
            <li><a href="/contact" class="hover:text-neon">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold">Support</h3>
          <ul class="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="/shipping" class="hover:text-neon">Shipping</a></li>
            <li><a href="/returns" class="hover:text-neon">Returns</a></li>
            <li><a href="/terms" class="hover:text-neon">Terms</a></li>
            <li><a href="/privacy-policy" class="hover:text-neon">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {year} Moringa. All rights reserved.
      </div>
    </footer>
  );
});
