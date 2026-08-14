import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import SettingsService from './settings_service.ts'
import { updateStoreSettingsValidator } from './settings_validators.ts'

@inject()
export default class SettingsController {
  constructor(@inject() private settingsService: SettingsService) {}

  async getStoreSettings({ response }: HttpContext) {
    const result = await this.settingsService.getStoreSettings()
    return response.json(result)
  }

  async updateStoreSettings({ request, response }: HttpContext) {
    const data = await request.validateUsing(updateStoreSettingsValidator)
    const result = await this.settingsService.updateStoreSettings(data)
    return response.json(result)
  }
}
