import { useCallback, useEffect, useState } from '@lynx-js/react'
import './App.css'

interface Video {
  id: number
  author: string
  description: string
  videoUrl?: string
  likes: number
  comments: number
  shares: number
}

export function App(props: { onRender?: () => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTikTok, setShowTikTok] = useState(false)

  useEffect(() => {
    console.info('TikTok Simulation Loading...')
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://192.168.1.16:3001/api/feed')

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success) {
        setVideos(result.data)
        console.log('Videos loaded:', result.data)
      } else {
        throw new Error('Failed to load videos')
      }
    } catch (err) {
      console.error('Failed to load videos:', err)
      setError(String(err))
      // Use mock data if API fails
      setVideos([
        { id: 1, author: '@johndoe', description: 'Check out this amazing dance! #viral #dance', likes: 15200, comments: 892, shares: 234 },
        { id: 2, author: '@janesmith', description: 'Cooking hack that will blow your mind 🤯 #cooking #lifehack', likes: 8900, comments: 445, shares: 123 },
        { id: 3, author: '@bobjohnson', description: 'My cat does the funniest thing #cats #funny #pets', likes: 25600, comments: 1205, shares: 567 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex(prev => (prev + 1) % videos.length)
  }, [videos.length])

  const prevVideo = useCallback(() => {
    setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length)
  }, [videos.length])

  const likeVideo = useCallback(() => {
    setVideos(prev => prev.map((video, index) => 
      index === currentVideoIndex 
        ? { ...video, likes: video.likes + 1 }
        : video
    ))
  }, [currentVideoIndex])

  const startTikTokSimulation = useCallback(() => {
    setShowTikTok(true)
  }, [])

  props.onRender?.()

  if (loading) {
    return (
      <view className="LoadingScreen">
        <text>Loading TikTok simulation...</text>
      </view>
    )
  }

  if (!showTikTok) {
    return (
      <view className="WelcomeScreen">
        <text className="AppTitle">TikTok Simulation</text>
        <text className="AppSubtitle">Tap to start scrolling</text>
        <view className="StartButton" bindtap={startTikTokSimulation}>
          <text>Start TikTok</text>
        </view>
        {error && <text className="ErrorText">Note: Using mock data (API error)</text>}
      </view>
    )
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <view className="TikTokContainer">
      {/* Video Area */}
      <view className="VideoContainer">
        <view className="VideoPlaceholder">
          <text className="VideoTitle">Video {currentVideo.id}</text>
          <text className="VideoAuthor">{currentVideo.author}</text>
        </view>
        
        {/* Navigation */}
        <view className="VideoNavigation">
          <view className="NavButton" bindtap={prevVideo}>
            <text>↑</text>
          </view>
          <view className="NavButton" bindtap={nextVideo}>
            <text>↓</text>
          </view>
        </view>
      </view>

      {/* Side Actions */}
      <view className="SideActions">
        <view className="ActionButton" bindtap={likeVideo}>
          <text className="ActionIcon">♥</text>
          <text className="ActionCount">{currentVideo.likes}</text>
        </view>
        
        <view className="ActionButton">
          <text className="ActionIcon">💬</text>
          <text className="ActionCount">{currentVideo.comments}</text>
        </view>
        
        <view className="ActionButton">
          <text className="ActionIcon">📤</text>
          <text className="ActionCount">{currentVideo.shares}</text>
        </view>
      </view>

      {/* Bottom Info */}
      <view className="BottomInfo">
        <text className="Username">{currentVideo.author}</text>
        <text className="Description">{currentVideo.description}</text>
      </view>

      {/* Debug Info */}
      <view className="DebugInfo">
        <text>Video {currentVideoIndex + 1} of {videos.length}</text>
      </view>
    </view>
  )
}