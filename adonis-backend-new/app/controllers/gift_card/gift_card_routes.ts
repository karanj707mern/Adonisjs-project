import GiftCardController from './gift_card_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerGiftCard(router: Router) {
  router
    .group(() => {
      router.post('redeem', [GiftCardController, 'redeem'])
      router.get('balance', [GiftCardController, 'balance'])

      router.get('', [GiftCardController, 'findAll']).middleware(middleware.auth()).middleware(middleware.admin())

      router.get(':id', [GiftCardController, 'findOne']).middleware(middleware.auth()).middleware(middleware.admin())

      router.post('', [GiftCardController, 'create']).middleware(middleware.auth()).middleware(middleware.admin())

      router.patch(':id', [GiftCardController, 'update']).middleware(middleware.auth()).middleware(middleware.admin())

      router.delete(':id', [GiftCardController, 'remove']).middleware(middleware.auth()).middleware(middleware.admin())
    })
    .prefix('gift-cards')
}
