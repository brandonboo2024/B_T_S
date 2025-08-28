import { useCallback, useEffect, useState } from '@lynx-js/react'

interface Video {
  id: number
  author: string
  description: string
  likes: number
  comments: number
  shares: number
  category: string
}

export function App(props: { onRender?: () => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showTikTok, setShowTikTok] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const mockVideos = [
        { id: 1, author: '@johndoe', description: 'Amazing dance moves! #viral #dance', likes: 15200, comments: 892, shares: 234, category: 'Dance' },
        { id: 2, author: '@janesmith', description: 'Cooking hack that will blow your mind #cooking', likes: 8900, comments: 445, shares: 123, category: 'Cooking' },
        { id: 3, author: '@funnyguy', description: 'This cat is hilarious #funny #pets', likes: 25600, comments: 1205, shares: 567, category: 'Comedy' },
        { id: 4, author: '@fashionista', description: 'OOTD for spring #fashion #style', likes: 12300, comments: 678, shares: 289, category: 'Fashion' },
        { id: 5, author: '@traveler', description: 'Hidden gem in Tokyo #travel #japan', likes: 18700, comments: 934, shares: 456, category: 'Travel' }
      ];
      setVideos(mockVideos)
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const nextVideo = useCallback(() => {
    setCurrentVideoIndex(prev => (prev + 1) % videos.length)
  }, [videos.length])

  const likeVideo = useCallback(() => {
    setVideos(prev => prev.map((video, index) => 
      index === currentVideoIndex 
        ? { ...video, likes: video.likes + 1 }
        : video
    ))
  }, [currentVideoIndex])

  const startCategory = useCallback((category: string) => {
    const categoryVideos = videos.filter(v => v.category === category)
    if (categoryVideos.length > 0) {
      const firstVideoIndex = videos.findIndex(v => v.category === category)
      setCurrentVideoIndex(firstVideoIndex)
    }
    setSelectedCategory(category)
    setShowTikTok(true)
  }, [videos])

  const goBack = useCallback(() => {
    setShowTikTok(false)
    setSelectedCategory('')
  }, [])

  props.onRender?.()

  if (loading) {
    return (
      <view style={{ padding: '20px', textAlign: 'center' }}>
        <text>Loading TikTok...</text>
      </view>
    )
  }

  if (!showTikTok) {
    return (
      <view style={{ 
        padding: '20px', 
        backgroundColor: '#000', 
        minHeight: '100vh',
        color: 'white'
      }}>
        <text style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          textAlign: 'center',
          display: 'block'
        }}>TikTok Simulation</text>
        
        <text style={{ 
          fontSize: '16px', 
          marginBottom: '30px',
          textAlign: 'center',
          display: 'block',
          color: '#888'
        }}>Choose a video category:</text>

        <view style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <view 
            bindtap={() => startCategory('Dance')}
            style={{
              backgroundColor: '#ff0050',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              💃 Dance Videos
            </text>
            <text style={{ color: 'white', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Trending dance moves and choreography
            </text>
          </view>

          <view 
            bindtap={() => startCategory('Cooking')}
            style={{
              backgroundColor: '#ff6b35',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              👩‍🍳 Cooking Hacks
            </text>
            <text style={{ color: 'white', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Quick recipes and kitchen tips
            </text>
          </view>

          <view 
            bindtap={() => startCategory('Comedy')}
            style={{
              backgroundColor: '#4ecdc4',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              😂 Comedy
            </text>
            <text style={{ color: 'white', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Funny videos and memes
            </text>
          </view>

          <view 
            bindtap={() => startCategory('Fashion')}
            style={{
              backgroundColor: '#9b59b6',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              👗 Fashion
            </text>
            <text style={{ color: 'white', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Style inspiration and outfit ideas
            </text>
          </view>

          <view 
            bindtap={() => startCategory('Travel')}
            style={{
              backgroundColor: '#3498db',
              padding: '15px',
              borderRadius: '10px',
              textAlign: 'center'
            }}
          >
            <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              ✈️ Travel
            </text>
            <text style={{ color: 'white', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              Amazing destinations and travel tips
            </text>
          </view>
        </view>
      </view>
    )
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <view style={{ 
      backgroundColor: '#000', 
      minHeight: '100vh', 
      color: 'white',
      position: 'relative'
    }}>
      {/* Back button */}
      <view 
        bindtap={goBack}
        style={{
          position: 'absolute',
          top: '50px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '20px'
        }}
      >
        <text style={{ color: 'white', fontSize: '16px' }}>← Back</text>
      </view>

      {/* Category title */}
      <view style={{
        position: 'absolute',
        top: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10
      }}>
        <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          {selectedCategory}
        </text>
      </view>

      {/* Video content */}
      <view style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, 
          hsl(${currentVideoIndex * 60}, 70%, 50%) 0%,
          hsl(${(currentVideoIndex * 60) + 120}, 60%, 40%) 100%)`
      }}>
        <view style={{ textAlign: 'center' }}>
          <text style={{ fontSize: '48px', marginBottom: '20px' }}>📱</text>
          <text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            {currentVideo.author}
          </text>
          <text style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '80%' }}>
            {currentVideo.description}
          </text>
        </view>
      </view>

      {/* Action buttons */}
      <view style={{
        position: 'absolute',
        right: '20px',
        bottom: '150px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <view bindtap={likeVideo} style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '10px',
          borderRadius: '25px',
          textAlign: 'center',
          minWidth: '50px'
        }}>
          <text style={{ fontSize: '20px' }}>❤️</text>
          <text style={{ fontSize: '12px', display: 'block' }}>
            {currentVideo.likes.toLocaleString()}
          </text>
        </view>

        <view style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '10px',
          borderRadius: '25px',
          textAlign: 'center',
          minWidth: '50px'
        }}>
          <text style={{ fontSize: '20px' }}>💬</text>
          <text style={{ fontSize: '12px', display: 'block' }}>
            {currentVideo.comments}
          </text>
        </view>
      </view>

      {/* Next video button */}
      <view 
        bindtap={nextVideo}
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff0050',
          padding: '15px 30px',
          borderRadius: '25px'
        }}
      >
        <text style={{ color: 'white', fontWeight: 'bold' }}>Next Video</text>
      </view>
    </view>
  )
}