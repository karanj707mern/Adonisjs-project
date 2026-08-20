import type { Router } from '@adonisjs/core/http';
import WishlistController from './wishlist_controller';

export default function registerWishlist(router) {
  router
    .group(() => {
      router.get('', [WishlistController, 'findAll']);

      router.post('guest-token', [WishlistController, 'createGuestWishlist']);

      router.post(':productId', [WishlistController, 'add']);

      router.delete(':productId', [WishlistController, 'remove']);

      router.get('guest-token/:token?', [
        WishlistController,
        'getGuestWishlist',
      ]);

      router.delete('guest-token/:token?', [
        WishlistController,
        'deleteGuestWishlist',
      ]);

      router
        .post('guest/merge', [WishlistController, 'mergeGuestWishlist'])
        .middleware('auth');
    })
    .prefix('Wishlist');
}
