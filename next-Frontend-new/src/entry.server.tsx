import { renderToStream, type RenderToStreamOptions } from '@builder.io/qwik/server'
import { QwikCityMockProvider } from '@builder.io/qwik-city/mock'
import { Root } from './root'

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    ...opts,
    containerAttributes: {
      lang: 'en',
      ...opts.containerAttributes,
    },
    serverData: {
      ...opts.serverData,
    },
  })
}
