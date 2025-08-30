import { useEffect, useState } from '@lynx-js/react'
import CreatorConsumerSwitch from './CreatorConsumerSwitch.js'
import './App.css'
import lynxLogo from './assets/lynx-logo.png'
import VideoContent from './utils/VideoContent.js'
import { furnituresPictures } from "./assets/furnitures/furnituresPictures.js"
import { useVideoActions } from './service/VideoActions.js'

export function App(props: { onRender?: () => void}) {
  props.onRender?.()

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
  } = useVideoActions();
  
  const [showMenu, setShowMenu] = useState(true);

  // Track view and start watch timer when video changes
  useEffect(() => {
    if (videos.length > 0 && !showMenu && !loading) {
      const currentVideo = videos[currentVideoIndex];
      if (currentVideo) {
        // Track watch time for previous video
        if (watchStartTime.current) {
          const prevIndex = currentVideoIndex === 0 ? videos.length - 1 : currentVideoIndex - 1;
          trackWatchTime(videos[prevIndex]?.id);
        }

        // Start new watch session
        watchStartTime.current = Date.now();
        trackEngagement('view', currentVideo.id);
      }
    }

    // Cleanup: track watch time when component unmounts or menu shows
    return () => {
      if (!showMenu && videos[currentVideoIndex]) {
        trackWatchTime(videos[currentVideoIndex].id);
        watchStartTime.current = 0;
      }
    };
  }, [currentVideoIndex, showMenu]);

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <view style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#000',
        minHeight: '100vh'
      }}>
        <text style={{ color: 'white', fontSize: '18px' }}>Loading...</text>
      </view>
    );
  }

  if (showMenu) {
  return(
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
                {videos.length} videos loaded from server
              </text>
              
              <view 
                bindtap={() => setShowMenu(false)}
                style={{
                  backgroundColor: '#ff0050',
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  marginTop: '20px'
                }}
              >
                <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                  Start Watching Videos
                </text>
              </view>
            </view>
            <view style={{ flex: 1 }} />
          </view>
        </view>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <view style={{ 
        padding: '20px', 
        paddingTop: '80px',
        textAlign: 'center',
        backgroundColor: '#000',
        minHeight: '100vh'
      }}>
        <text style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>
          No videos available
        </text>
        <text style={{ color: '#888', fontSize: '14px' }}>
          Make sure the backend server is running
        </text>
        <view 
          bindtap={() => fetchVideos()}
          style={{
            marginTop: '20px',
            backgroundColor: '#ff0050',
            padding: '10px 20px',
            borderRadius: '10px',
          }}
        >
          <text style={{ color: 'white' }}>Retry</text>
        </view>
      </view>
    );
  }

  return (
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
  );
}
