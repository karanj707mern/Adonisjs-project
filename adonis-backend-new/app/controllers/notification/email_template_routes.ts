import type { Router } from '@adonisjs/core/http';
import EmailTemplateController from './email_template_controller';

export default function registerEmailTemplate(router) {
  router
    .group(() => {
      router.get('', [EmailTemplateController, 'getAll']);
      router.get(':id', [EmailTemplateController, 'getOne']);
      router.post('', [EmailTemplateController, 'create']);
      router.patch(':id', [EmailTemplateController, 'update']);
      router.delete(':id', [EmailTemplateController, 'remove']);
    })
    .prefix('Email-Template');
}
