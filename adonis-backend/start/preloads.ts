import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Global preloads executed on boot. Left minimal; providers handle wiring.
 */
export default async function preloads(_app: ApplicationService) {}
