import { render, type RenderOptions } from '@builder.io/qwik'
import { Router, type RouterProps } from '@builder.io/qwik-city'
import { QwikCityMockProvider } from '@builder.io/qwik-city/mock'
import { Head } from './components/Head'

export default render((props) => {
  const { app, documentation } = props as { app: any; documentation: any }

  return (
    <QwikCityMockProvider>
      <Head />
      <Router app={app} documentation={documentation} />
    </QwikCityMockProvider>
  )
}, document.getElementById('app')!)
