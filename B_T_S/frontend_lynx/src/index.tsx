import '@lynx-js/preact-devtools'
import '@lynx-js/react/debug'
import { root } from '@lynx-js/react'
import WrappedApp from './WrappedApp'

root.render(<WrappedApp />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}


