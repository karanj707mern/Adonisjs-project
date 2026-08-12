import { component$, Slot } from '@builder.io/qwik'
import { MainNavbar } from './MainNavbar'
import { Footer } from './Footer'

export const SiteNav = component$(() => {
  return (
    <div>
      <MainNavbar />
      <main>
        <Slot />
      </main>
      <Footer />
    </div>
  )
})
