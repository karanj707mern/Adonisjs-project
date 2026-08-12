import { component$, useVisibleTask$ } from '@builder.io/qwik'
import { getSession } from '~lib/session'

export const SessionHydrator = component$(() => {
  useVisibleTask$(async () => {
    await getSession()
  })

  return null
})
