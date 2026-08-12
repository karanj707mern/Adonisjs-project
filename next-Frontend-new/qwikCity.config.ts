import { type Config } from '@builder.io/qwik-city/middleware/aws-lambda'
import { type Config as NodeConfig } from '@builder.io/qwik-city/middleware/node-http'

declare module '@builder.io/qwik-city' {
  interface QwikCityPluginOptions {
    config?: Config | NodeConfig
  }
}

export default {
  config: {
    cacheControl: 'no-cache',
  },
}
