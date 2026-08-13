import vine from '@vinejs/vine'
import type { Router } from '@adonisjs/core/http'
import EmailTemplateController from './email_template_controller'

export default function registerEmailTemplate(router: Router) {
  router.get('', [EmailTemplateController, 'getAll'])
  router.get(':id', [EmailTemplateController, 'getOne'])
  router.post('', [EmailTemplateController, 'create'])
  router.patch(':id', [EmailTemplateController, 'update'])
  router.delete(':id', [EmailTemplateController, 'remove'])
}
