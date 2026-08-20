import type { Router } from '@adonisjs/core/http';
import CartController from './cart_controller';

export default function registerCart(router) {
  router
    .group(() => {
      router.post('cart', [CartController, 'create']);
      router.get('cart', [CartController, 'findAll']);
      router.get('cart/:id', [CartController, 'findOne']);
      router.patch('cart/:id', [CartController, 'update']);
      router.delete('cart/:id', [CartController, 'remove']);
      router.delete('cart', [CartController, 'clear']);
      router.post('cart/guest', [CartController, 'createGuestCart']);
      router
        .get('cart/guest', [CartController, 'getGuestCart'])
        .as('cart.get_guest_cart');
      router
        .get('cart/guest/:token', [CartController, 'getGuestCart'])
        .as('cart.get_guest_cart_by_token');
      router.post('cart/guest/merge', [CartController, 'mergeGuestCart']);
      router
        .delete('cart/guest', [CartController, 'deleteGuestCart'])
        .as('cart.delete_guest_cart');
      router
        .delete('cart/guest/:token', [CartController, 'deleteGuestCart'])
        .as('cart.delete_guest_cart_by_token');
    })
    .prefix('Cart');
}
