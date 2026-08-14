import NewArrivalController from './new_arrival_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerNewArrival(router: Router) {
  router
    .group(() => {
      router.get('', [NewArrivalController, 'findAll'])
      router.get(':id', [NewArrivalController, 'findOne'])
      router.post('', [NewArrivalController, 'create']).middleware(middleware.auth()).middleware(middleware.admin())
      router.patch(':id', [NewArrivalController, 'update']).middleware(middleware.auth()).middleware(middleware.admin())
      router.delete(':id', [NewArrivalController, 'remove']).middleware(middleware.auth()).middleware(middleware.admin())
    })
    .prefix('new-arrivals')
}
