import { component$, useSignal } from '@builder.io/qwik'
import { Link } from '@builder.io/qwik-city'

export default component$(() => {
  const isMenuOpen = useSignal(false)

  return (
    <nav class="bg-white dark:bg-stone-800 shadow-lg sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" class="text-2xl font-bold text-primary-600">
            Moringa Store
          </Link>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-8">
            <Link href="/shop" class="btn-nav">
              Shop
            </Link>
            <Link href="/wellness-journal" class="btn-nav">
              Journal
            </Link>
            <Link href="/about-us" class="btn-nav">
              About
            </Link>
            <Link href="/contact" class="btn-nav">
              Contact
            </Link>
          </div>

          {/* Right Side */}
          <div class="hidden md:flex items-center gap-4">
            {/* Cart */}
            <Link href="/cart" class="relative p-2 text-stone-600 dark:text-stone-300 hover:text-primary-600">
              <span class="text-xl">🛒</span>
              <span class="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" class="p-2 text-stone-600 dark:text-stone-300 hover:text-primary-600">
              <span class="text-xl">❤️</span>
            </Link>

            {/* User */}
            <Link href="/auth" class="btn btn-primary">
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            class="md:hidden p-2"
            onClick$={() => isMenuOpen.value = !isMenuOpen.value}
          >
            <span class="text-2xl">☰</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen.value && (
          <div class="md:hidden py-4 border-t border-stone-200 dark:border-stone-700">
            <div class="flex flex-col gap-4">
              <Link href="/shop" class="text-stone-600 dark:text-stone-300">Shop</Link>
              <Link href="/wellness-journal" class="text-stone-600 dark:text-stone-300">Journal</Link>
              <Link href="/about-us" class="text-stone-600 dark:text-stone-300">About</Link>
              <Link href="/contact" class="text-stone-600 dark:text-stone-300">Contact</Link>
              <Link href="/auth" class="btn btn-primary">Sign In</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
})
