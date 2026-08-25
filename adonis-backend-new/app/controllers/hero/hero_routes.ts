import type { Router } from '@adonisjs/core/http';
import HeroController from './hero_controller.js';
import { middleware } from '#start/kernel';

export default function registerHero(router: Router) {
  router
    .group(() => {
      router.get('active', [HeroController, 'findActive']);

      router
        .get('', [HeroController, 'findAll'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .get(':id', [HeroController, 'findOne'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .post('', [HeroController, 'create'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .post('upload-image', [HeroController, 'uploadImage'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .patch(':id', [HeroController, 'update'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());

      router
        .delete(':id', [HeroController, 'remove'])
        .middleware(middleware.auth())
        .middleware(middleware.admin());
    })
    .prefix('Hero');
}
