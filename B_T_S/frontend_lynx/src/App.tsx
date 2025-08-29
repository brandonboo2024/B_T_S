import { useCallback, useEffect, useState } from '@lynx-js/react'
import './index.css'
import './App.css'
import arrow from './assets/arrow.png'
import lynxLogo from './assets/lynx-logo.png'
import reactLynxLogo from './assets/react-logo.png'
import Gallery from './util/Gallery.js'
import { furnituresPictures } from './assets/furnitures/furnituresPictures.js'

// creating construct for Video
interface Video {
  id: number
  author: string
  description: string
}

export function App(props: {
  onRender?: () => void
}) {
  const [currentPage, setCurrentPage] = useState('welcome');
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

  //  Function for the TikTok feed screen
  const TikTokFeed = () => (
    <view style={{ padding: "20px" }}>
      <text style={{ fontSize: "24px", fontWeight: 'bold', marginBottom: "20px" }}>
        TikTok Feed
      </text>
      
      {videos.map(video => (
        <view key={video.id} style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: '#f0f0f0',
          borderRadius: "10px" 
        }}>
          <text style={{color: 'black', fontWeight: 'bold', fontSize: "18px" }}>
            @{video.author}
          </text>
          <text style={{ color: 'black', marginTop: "5px" }}>
            {video.description}
          </text>
          <text style={{ color: 'black', marginTop: "10px" }}>
            ❤️ 1.2K likes · 💬 45 comments
          </text>
        </view>
      ))}
    </view>
  );

  const GalleryScreen = () => (
    <view>
    <Gallery pictureData = {furnituresPictures} />
    </view>
  ); 

  // 👇 Add this function for the welcome screen
  const WelcomeScreen = () => (
    <view>
      <view className='Content'>
        <image src={arrow} className='Arrow' />
        <text className='Description'>Tap the logo to start the simulation!</text>
      </view>

      {/* 👇 API STATUS DISPLAY */}
      <view style={{ padding: "10px" }}>
        {loading && <text>Loading videos...</text>}
        {error && <text>Error: {error}</text>}
        {!loading && !error && videos.length > 0 && (
          <view>
            <text>✅ Loaded {videos.length} videos:</text>
            {videos.map(video => (
              <view key={video.id} style={{ marginLeft: "10px", marginTop: "5px" }}>
                <text>ID: {video.id}</text>
                <text>Title: {video.author}</text>
                <text>Description: {video.description}</text>
              </view>
            ))}
          </view>
        )}
        {!loading && !error && videos.length === 0 && (
          <text>No videos found</text>
        )}
      </view>
    </view>
  );

  props.onRender?.()

  const onTap = useCallback(() => {
    'background only'
    setCurrentPage(prevPage => prevPage === 'welcome' ? 'tiktok' : 'welcome')
    setAlterLogo(prevAlterLogo => !prevAlterLogo)
  }, [])

  return (
    <view>
      {/* <view className='Background' /> */}
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
        
        {/* 👇 THIS IS THE MAGIC PART - SWITCH BETWEEN SCREENS */}
        {currentPage === 'welcome' ? <GalleryScreen /> : <TikTokFeed />}
        
        <view style={{ flex: 1 }} />
      </view>
    </view>
  )

}
