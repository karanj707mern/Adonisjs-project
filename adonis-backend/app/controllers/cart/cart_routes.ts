import type { Router } from '@adonisjs/core/http'
import CartController from './cart_controller'

export default function registerCart(router: Router) {
  router.post('cart', [CartController, 'create'])
  router.get('cart', [CartController, 'findAll'])
  router.get('cart/:id', [CartController, 'findOne'])
  router.patch('cart/:id', [CartController, 'update'])
  router.delete('cart/:id', [CartController, 'remove'])
  router.delete('cart', [CartController, 'clear'])
  router.post('cart/guest', [CartController, 'createGuestCart'])
  router.get('cart/guest', [CartController, 'getGuestCart'])
  router.get('cart/guest/:token', [CartController, 'getGuestCart'])
  router.post('cart/guest/merge', [CartController, 'mergeGuestCart'])
  router.delete('cart/guest', [CartController, 'deleteGuestCart'])
  router.delete('cart/guest/:token', [CartController, 'deleteGuestCart'])
}
