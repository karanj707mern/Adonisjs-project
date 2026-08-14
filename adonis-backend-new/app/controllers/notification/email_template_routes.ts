import EmailTemplateController from './email_template_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerEmailTemplate(router: Router) {
  router
    .group(() => {
      router.get('', [EmailTemplateController, 'getAll'])
      router.get(':id', [EmailTemplateController, 'getOne'])
      router.post('', [EmailTemplateController, 'create']).middleware(middleware.auth()).middleware(middleware.admin())
      router
        .patch(':id', [EmailTemplateController, 'update'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())
      router
        .delete(':id', [EmailTemplateController, 'remove'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())
    })
    .prefix('email-templates')
}
