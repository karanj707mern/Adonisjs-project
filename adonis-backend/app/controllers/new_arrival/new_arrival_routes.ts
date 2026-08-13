import type { Router } from '@adonisjs/core/http'
import NewArrivalController from './new_arrival_controller'

export default function registerNewArrival(router: Router) {
  router.get('active', [NewArrivalController, 'findActive'])

  router.get('', [NewArrivalController, 'findAll'])
    .middleware('auth')
    .middleware('admin')

  router.get(':id', [NewArrivalController, 'findOne'])
    .middleware('auth')
    .middleware('admin')

  router.post('', [NewArrivalController, 'create'])
    .middleware('auth')
    .middleware('admin')

  router.post('upload-image', [NewArrivalController, 'uploadImage'])
    .middleware('auth')
    .middleware('admin')

  router.patch(':id', [NewArrivalController, 'update'])
    .middleware('auth')
    .middleware('admin')

  router.delete(':id', [NewArrivalController, 'remove'])
    .middleware('auth')
    .middleware('admin')
}
