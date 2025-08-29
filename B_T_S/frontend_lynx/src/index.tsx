import '@lynx-js/preact-devtools'
import '@lynx-js/react/debug'
import { root } from '@lynx-js/react'
import WrappedApp from './WrappedApp.js'

root.render(<WrappedApp />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}


