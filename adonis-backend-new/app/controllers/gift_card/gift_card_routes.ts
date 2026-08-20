import type { Router } from '@adonisjs/core/http';
import GiftCardController from './gift_card_controller';

export default function registerGiftCard(router) {
  router
    .group(() => {
      router.post('redeem', [GiftCardController, 'redeem']);
      router.get('balance', [GiftCardController, 'balance']);

      router
        .get('', [GiftCardController, 'findAll'])
        .middleware('auth')
        .middleware('admin');

      router
        .get(':id', [GiftCardController, 'findOne'])
        .middleware('auth')
        .middleware('admin');

      router
        .post('', [GiftCardController, 'create'])
        .middleware('auth')
        .middleware('admin');

      router
        .patch(':id', [GiftCardController, 'update'])
        .middleware('auth')
        .middleware('admin');

      router
        .delete(':id', [GiftCardController, 'remove'])
        .middleware('auth')
        .middleware('admin');
    })
    .prefix('Gift-Card');
}
