import WishlistController from './wishlist_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerWishlist(router: Router) {
  router
    .group(() => {
      router.get('', [WishlistController, 'findAll'])

      router.post('guest-token', [WishlistController, 'createGuestWishlist'])

      router.post(':productId', [WishlistController, 'add'])

      router.delete(':productId', [WishlistController, 'remove'])

      router.get('guest-token/:token?', [WishlistController, 'getGuestWishlist'])

      router.delete('guest-token/:token?', [WishlistController, 'deleteGuestWishlist'])

      router.post('guest/merge', [WishlistController, 'mergeGuestWishlist']).middleware(middleware.auth())
    })
    .prefix('wishlist')
}
