import { useCallback, useEffect, useState } from '@lynx-js/react'

import './App.css'
import arrow from './assets/arrow.png'
import lynxLogo from './assets/lynx-logo.png'
import reactLynxLogo from './assets/react-logo.png'

// creating construct for Video
interface Video {
  id: number
  author: string
  description: string
}

export function App(props: {
  onRender?: () => void
}) {
  const [alterLogo, setAlterLogo] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    console.info('Hello, ReactLynx')
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try{
      setLoading(true)
      setError(null)

      const response = await fetch('http://192.168.1.68:5000/api/feed')

      if(!response.ok){
        throw new Error(`Server error: ${response.status}`)
      }
      
      const result = await response.json()

      if(result.success) {
        setVideos(result.data) // save videos to state
        console.log('Videos loaded:', result.data)
      }else{
        throw new Error('Failed to load videos')
      }
    }catch(err) {
      console.error('Complete and total failure:', err)
      setError(String(err))
    } finally{
      setLoading(false)
    }
  }

  props.onRender?.()


  const onTap = useCallback(() => {
    'background only'
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
          <text className='Title'>TikTok</text>
          <text className='Subtitle'>on Lynx</text>
        </view>
        
        <view className='Content'>
          <image src={arrow} className='Arrow' />
          <text className='Description'>Tap the logo to start the simulation!</text>
          {/* commented out small hint for now */}
          {/* <text className='Hint'> */}
          {/*   Edit<text */}
          {/*     style={{ */}
          {/*       fontStyle: 'italic', */}
          {/*       color: 'rgba(255, 255, 255, 0.85)', */}
          {/*     }} */}
          {/*   > */}
          {/*     {' src/App.tsx '} */}
          {/*   </text> */}
          {/*   to see updates! */}
          {/* </text> */}
        </view>

        {/* 👇 SIMPLE API STATUS DISPLAY */}
        <view style={{ padding: 10 }}>
          {/* Show loading status */}
          {loading && <text>Loading videos...</text>}
          
          {/* Show error status */}
          {error && <text>Error: {error}</text>}
          
          {/* Show success status */}
          {!loading && !error && videos.length > 0 && (
            <view>
              <text>✅ Loaded {videos.length} videos:</text>
              {videos.map(video => (
                <view key={video.id} style={{ marginLeft: 10, marginTop: 5 }}>
                  <text>ID: {video.id}</text>
                  <text>Title: {video.author}</text>
                  <text>Description: {video.description}</text>
                </view>
              ))}
            </view>
          )}
          
          {/* Show empty status */}
          {!loading && !error && videos.length === 0 && (
            <text>No videos found</text>
          )}
        </view>

        <view style={{ flex: 1 }} />
      </view>
    </view>
  )
}
