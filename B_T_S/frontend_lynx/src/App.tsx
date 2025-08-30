// src/App.tsx — minimal-diff with Livestream button
// Notes:
// - Preserves your original structure and styles.
// - Adds feed switch + Livestream button + Livestream rendering.
// - Requires: useLivestreamActions in ./service/VideoActions.js and LivestreamContent.tsx in project root.

import { useEffect, useState } from '@lynx-js/react'
import CreatorConsumerSwitch from './CreatorConsumerSwitch.js'
import './App.css'
import lynxLogo from './assets/lynx-logo.png'
import VideoContent from './utils/VideoContent.js'
import { furnituresPictures } from "./assets/furnitures/furnituresPictures.js"
import { useVideoActions, useLivestreamActions } from './service/VideoActions.js'
import LivestreamContent from './LivestreamContent.js'

export function App(props: { onRender?: () => void}) {
  props.onRender?.()

  // existing videos API
  const {
    videos,
    loading,
    currentVideoIndex,
    setCurrentVideoIndex,
    watchStartTime,
    videoWatchTimes,
    fetchVideos,
    trackEngagement,
    trackWatchTime,
    likeVideo,
    commentVideo,
    shareVideo,
    saveVideo,
  } = useVideoActions()

  // NEW: livestream API (non-invasive)
  const live = useLivestreamActions()

  // original state
  const [showMenu, setShowMenu] = useState(true)
  // NEW: which feed to render
  const [feed, setFeed] = useState<'videos' | 'livestreams'>('videos')

  // Back button action (shared)
  const goHome = () => { setShowMenu(true); setFeed('videos'); }

  // Small pill back button (fixed positioning)
  const BackButton = ({ top = 12 }: { top?: number }) => (
    <view
      bindtap={goHome}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: '12px',
        zIndex: 2147483647,
        padding: '8px 14px',
        borderRadius: '999px',
        border: '1px solid rgba(0,0,0,0.15)',
        backgroundColor: 'rgba(255,255,255,0.95)'
      }}
    >
      <text style={{ color: '#000', fontSize: '14px', fontWeight: '600' }}>← Back</text>
    </view>
  )

  // ---- original video watch-time effect (kept) ----
  useEffect(() => {
    if (feed !== 'videos') return
    if (videos.length > 0 && !showMenu && !loading) {
      const currentVideo = videos[currentVideoIndex]
      if (currentVideo) {
        if (watchStartTime.current) {
          const prevIndex = currentVideoIndex === 0 ? videos.length - 1 : currentVideoIndex - 1
          trackWatchTime(videos[prevIndex]?.id)
        }
        watchStartTime.current = Date.now()
        trackEngagement('view', currentVideo.id)
      }
    }
    return () => {
      if (!showMenu && videos[currentVideoIndex]) {
        trackWatchTime(videos[currentVideoIndex].id)
        watchStartTime.current = 0 as unknown as number
      }
    }
  }, [feed, currentVideoIndex, showMenu])

  // ---- NEW: livestream watch-time effect (mirrors videos) ----
  useEffect(() => {
    if (feed !== 'livestreams') return
    const { streams, loading, currentStreamIndex, watchStartTime, trackWatchTime, trackStreamEngagement } = live
    if (streams.length > 0 && !showMenu && !loading) {
      const current = streams[currentStreamIndex]
      if (current) {
        if (watchStartTime.current) {
          const prevIndex = currentStreamIndex === 0 ? streams.length - 1 : currentStreamIndex - 1
          trackWatchTime(streams[prevIndex]?.id)
        }
        watchStartTime.current = Date.now()
        trackStreamEngagement('view', current.id)
      }
    }
    return () => {
      if (!showMenu && live.streams[live.currentStreamIndex]) {
        trackWatchTime(live.streams[live.currentStreamIndex].id)
        watchStartTime.current = 0 as unknown as number
      }
    }
  }, [feed, live.currentStreamIndex, showMenu])

  // initial loads
  useEffect(() => { fetchVideos(); live.fetchStreams(); }, [])

  // loading screen (kept)
  if (loading && live.loading) {
    return (
      <view style={{ padding: '20px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh' }}>
        <text style={{ color: 'white', fontSize: '18px' }}>Loading...</text>
      </view>
    )
  }

  // menu screen — unchanged visuals, plus Livestreams button
  if (showMenu) {
    return (
      <view>
        <view className='Background' />
        <view className='App'>
          {/* Centered Logo Banner like in the original App.tsx */}
          <view className='Banner'>
            <view className='Logo'>
              <image src={lynxLogo} className='Logo--lynx' />
            </view>
            <text className='Title'>TikTok</text>
            <text className='Subtitle'>Value Sharing Demo</text>
          </view>

          {/* Your TikTok demo content */}
          <view className='Content'>
            <text className='Description'>
              {videos.length} videos · {live.streams.length} livestreams loaded
            </text>

            {/* original Start Watching Videos button */}
            <view
              bindtap={() => { setFeed('videos'); setShowMenu(false) }}
              style={{ backgroundColor: '#ff0050', padding: '15px', borderRadius: '10px', textAlign: 'center', marginTop: '20px' }}
            >
              <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Start Watching Videos</text>
            </view>

            {/* NEW: Start Watching Livestreams button */}
            <view
              bindtap={() => { setFeed('livestreams'); setShowMenu(false) }}
              style={{ backgroundColor: '#2ecc71', padding: '15px', borderRadius: '10px', textAlign: 'center', marginTop: '10px' }}
            >
              <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Start Watching Livestreams</text>
            </view>
          </view>
          <view style={{ flex: 1 }} />
        </view>
      </view>
    )
  }

  // livestream feed
  if (feed === 'livestreams') {
    const { streams, currentStreamIndex, setCurrentStreamIndex, likeStream, commentStream, shareStream, saveStream, donateToLivestream } = live
    if (!streams || streams.length === 0) {
      return (
        <view style={{ padding: '20px', paddingTop: '80px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh' }}>
          <text style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>No livestreams available</text>
          <view bindtap={() => live.fetchStreams()} style={{ marginTop: '20px', backgroundColor: '#2ecc71', padding: '10px 20px', borderRadius: '10px' }}>
            <text style={{ color: 'white' }}>Retry</text>
          </view>
        </view>
      )
    }

    return (
      <view>
        {/* Back sits below the LIVE badge to avoid overlap */}
        <BackButton top={56} />
        <CreatorConsumerSwitch videos={streams}>
          <LivestreamContent
            streams={streams}
            currentStreamIndex={currentStreamIndex}
            setCurrentStreamIndex={setCurrentStreamIndex}
            likeStream={likeStream}
            commentStream={commentStream}
            shareStream={shareStream}
            saveStream={saveStream}
            donateToLivestream={donateToLivestream}
          />
        </CreatorConsumerSwitch>
      </view>
    )
  }

  // videos feed (original)
  if (!videos || videos.length === 0) {
    return (
      <view style={{ padding: '20px', paddingTop: '80px', textAlign: 'center', backgroundColor: '#000', minHeight: '100vh' }}>
        <text style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>No videos available</text>
        <text style={{ color: '#888', fontSize: '14px' }}>Make sure the backend server is running</text>
        <view bindtap={() => fetchVideos()} style={{ marginTop: '20px', backgroundColor: '#ff0050', padding: '10px 20px', borderRadius: '10px' }}>
          <text style={{ color: 'white' }}>Retry</text>
        </view>
      </view>
    )
  }

  return (
    <view>
      <BackButton top={56} />
      <CreatorConsumerSwitch videos={videos}>
        <VideoContent
          pictureData={furnituresPictures}
          videos={videos}
          currentVideoIndex={currentVideoIndex}
          setCurrentVideoIndex={setCurrentVideoIndex}
          likeVideo={likeVideo}
          commentVideo={commentVideo}
          shareVideo={shareVideo}
          saveVideo={saveVideo}
        />
      </CreatorConsumerSwitch>
    </view>
  )
}
