import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import SettingsService from './settings_service';
import { updateStoreSettingsValidator } from './settings_validators';

@inject()
export default class SettingsController {
  constructor(private settingsService: SettingsService) {}

  async getStoreSettings({ response }: HttpContext) {
    const result = await this.settingsService.getStoreSettings();
    return response.json(result);
  }

  async updateStoreSettings({ request, response }: HttpContext) {
    const data = await request.validateUsing(updateStoreSettingsValidator);
    const result = await this.settingsService.updateStoreSettings(data);
    return response.json(result);
  }
}
