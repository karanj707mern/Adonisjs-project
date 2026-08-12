import { component$, Slot } from '@builder.io/qwik'

export default component$(() => {
  return (
    <footer class="bg-stone-800 text-stone-300 py-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold text-white mb-4">Moringa Store</h3>
            <p class="text-stone-400">
              Natural wellness products for a healthier you.
            </p>
          </div>

          <div>
            <h4 class="font-semibold text-white mb-4">Shop</h4>
            <ul class="space-y-2">
              <li><a href="/shop" class="hover:text-white transition-colors">All Products</a></li>
              <li><a href="/shop?category=wellness" class="hover:text-white transition-colors">Wellness</a></li>
              <li><a href="/shop?category=skincare" class="hover:text-white transition-colors">Skincare</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-white mb-4">Company</h4>
            <ul class="space-y-2">
              <li><a href="/about-us" class="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" class="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/blog" class="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-white mb-4">Support</h4>
            <ul class="space-y-2">
              <li><a href="/shipping" class="hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="/returns" class="hover:text-white transition-colors">Returns</a></li>
              <li><a href="/terms" class="hover:text-white transition-colors">Terms</a></li>
              <li><a href="/privacy-policy" class="hover:text-white transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-stone-700 mt-8 pt-8 text-center text-stone-400">
          <p>© {new Date().getFullYear()} Moringa Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
})
