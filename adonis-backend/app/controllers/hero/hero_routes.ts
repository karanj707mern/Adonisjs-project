import type { Router } from '@adonisjs/core/http';
import HeroController from './hero_controller';

export default function registerHero(router: Router) {
  router.get('active', [HeroController, 'findActive']);

  router
    .get('', [HeroController, 'findAll'])
    .middleware('auth')
    .middleware('admin');

  router
    .get(':id', [HeroController, 'findOne'])
    .middleware('auth')
    .middleware('admin');

  router
    .post('', [HeroController, 'create'])
    .middleware('auth')
    .middleware('admin');

  router
    .post('upload-image', [HeroController, 'uploadImage'])
    .middleware('auth')
    .middleware('admin');

  router
    .patch(':id', [HeroController, 'update'])
    .middleware('auth')
    .middleware('admin');

  router
    .delete(':id', [HeroController, 'remove'])
    .middleware('auth')
    .middleware('admin');
}
