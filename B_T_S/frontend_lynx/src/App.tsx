
import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'
import arrow from './assets/arrow.png'
import lynxLogo from './assets/lynx-logo.png'
import reactLynxLogo from './assets/react-logo.png'

export function App(props: {
  onRender?: () => void
}) {
  const [alterLogo, setAlterLogo] = useState(false)
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    console.info('Hello, ReactLynx')
    checkBackendConnection()
  }, [])

  props.onRender?.()

  const checkBackendConnection = useCallback(async () => {
    console.log('Attempting to connect to backend...')
    try {
      const response = await fetch('http://localhost:3001/api/test')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Backend data received:', data)
      setBackendStatus(`✅ Connected: ${data.message}`)
      setApiData(data)
    } catch (error) {
      console.error('Connection failed:', error)
      setBackendStatus(`❌ Connection failed: ${error.message}`)
    }
  }, [])

  const sendDataToBackend = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: 'Hello from ReactLynx frontend!',
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Backend response:', result)
      setApiData(result)
      setBackendStatus(`✅ Data sent successfully`)
    } catch (error) {
      console.error('Error sending data:', error)
      setBackendStatus(`❌ Failed to send data: ${error.message}`)
    }
  }, [])

  const onTap = useCallback(() => {
    setAlterLogo(prevAlterLogo => !prevAlterLogo)
  }, [])

  return (
    <view>
      <view className='Background' />
      <view className='App'>
        <view className='Banner'>
          <view className='Logo' bindtap={onTap}>
            {alterLogo
              ? <image src={reactLynxLogo} className='Logo--react' />
              : <image src={lynxLogo} className='Logo--lynx' />}
          </view>
          <text className='Title'>React</text>
          <text className='Subtitle'>on Lynx</text>
        </view>
        
        <view className='Content'>
          <text className='ConnectionStatus'>{backendStatus}</text>
          
          {apiData && (
            <text className='ApiData'>
              Last response: {new Date(apiData.timestamp || Date.now()).toLocaleTimeString()}
            </text>
          )}
          
          <button bindtap={checkBackendConnection} className='TestButton'>
            Test Connection
          </button>
          
          <button bindtap={sendDataToBackend} className='SendButton'>
            Send Data
          </button>
        </view>
        
        <view className='Content'>
          <image src={arrow} className='Arrow' />
          <text className='Description'>Tap the logo and have fun!</text>
          <text className='Hint'>
            Edit<text
              style={{
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              {' src/App.tsx '}
            </text>
            to see updates!
          </text>
        </view>
        <view style={{ flex: 1 }} />
      </view>
    </view>
  )
}
