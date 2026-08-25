import type { Router } from '@adonisjs/core/http';
import UserController from './user_controller.js';
import { middleware } from '#start/kernel';

export default function registerUser(router: Router) {
  router
    .group(() => {
      router
        .group(() => {
          router
            .post('', [UserController, 'create'])
            .middleware(middleware.admin());
          router
            .get('', [UserController, 'findAll'])
            .middleware(middleware.admin());
          router.get(':id', [UserController, 'findOne']);
          router.patch(':id', [UserController, 'update']);
          router
            .delete(':id', [UserController, 'remove'])
            .middleware(middleware.admin());
        })
        .middleware(middleware.auth());
    })
    .prefix('User');
}
