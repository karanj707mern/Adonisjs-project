import type { Router } from '@adonisjs/core/http';
import NewArrivalController from './new_arrival_controller.js';
import { middleware } from '#start/kernel';

export default function registerNewArrival(router: Router) {
  router
    .group(() => {
      router.get('active', [NewArrivalController, 'findActive']);

      router
        .get('', [NewArrivalController, 'findAll'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .get(':id', [NewArrivalController, 'findOne'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .post('', [NewArrivalController, 'create'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .post('upload-image', [NewArrivalController, 'uploadImage'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .patch(':id', [NewArrivalController, 'update'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .delete(':id', [NewArrivalController, 'remove'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());
    })
    .prefix('New-Arrival');
}
