import HeroController from './hero_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerHero(router: Router) {
  router
    .group(() => {
      router.get('', [HeroController, 'findAll'])
      router.get(':id', [HeroController, 'findOne'])
      router.post('', [HeroController, 'create']).middleware(middleware.auth()).middleware(middleware.admin())
      router.patch(':id', [HeroController, 'update']).middleware(middleware.auth()).middleware(middleware.admin())
      router.delete(':id', [HeroController, 'remove']).middleware(middleware.auth()).middleware(middleware.admin())
    })
    .prefix('hero')
}
