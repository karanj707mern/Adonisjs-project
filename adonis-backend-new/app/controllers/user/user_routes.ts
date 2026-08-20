import type { Router } from '@adonisjs/core/http';
import UserController from './user_controller';

export default function registerUser(router) {
  router.group(() => {
    router
        .group(() => {
          router.post('', [UserController, 'create']).middleware('admin');
          router.get('', [UserController, 'findAll']).middleware('admin');
          router.get(':id', [UserController, 'findOne']);
          router.patch(':id', [UserController, 'update']);
          router.delete(':id', [UserController, 'remove']).middleware('admin');
        })
        .middleware('auth');
  }).prefix('User');
}
