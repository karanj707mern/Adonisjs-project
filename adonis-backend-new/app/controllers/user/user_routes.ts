import UserController from './user_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerUser(router: Router) {
  router
    .group(() => {
      router.post('', [UserController, 'create']).middleware(middleware.admin())
      router.get('', [UserController, 'findAll']).middleware(middleware.admin())
      router.get(':id', [UserController, 'findOne'])
      router.patch(':id', [UserController, 'update'])
      router.delete(':id', [UserController, 'remove']).middleware(middleware.admin())
    })
    .prefix('users')
    .middleware(middleware.auth())
}
