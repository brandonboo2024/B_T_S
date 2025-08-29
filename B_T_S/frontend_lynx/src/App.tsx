import {useEffect, useRef,  useCallback, useState } from '@lynx-js/react'
import  CreatorConsumerSwitch from './CreatorConsumerSwitch.js'

interface AppProps {
  onRender?: () => void
}

export function App({onRender}: AppProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const watchStartTime = useRef<number>();
  const videoWatchTimes = useRef<number[]>([]);

  const API_BASE_URL = 'http://192.168.1.98:3001'; // Update with your IP

  interface Video{
    id: number;
    author: string;
    description: string;
    likes?: number | string;
    comments?: number | string;
    shares?: number;
    views?: number;
    saves?: number;
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/videos`);
      const data = await response.json();

      if (data.success && data.data) {
        setVideos(data.data);
      } else {
        console.error('No videos received from server');
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // No fallback data - rely on backend
    } finally {
      setLoading(false);
    }
  };

  const trackEngagement = async (type: string, videoId: number, metadata = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          type,
          userId: 'demo_user',
          ...metadata
        })
      });

      const data = await response.json();
      if (data.success && data.currentStats) {
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, ...data.currentStats } : v
        ));
      }
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  };

  // Track watch time when leaving a video
  const trackWatchTime = (videoId: number) => {
    if (watchStartTime.current) {
      const watchDuration = (Date.now() - watchStartTime.current) / 1000; // in seconds
      const totalDuration = 30; // assume 30 second videos for demo
      const completionRate = Math.min(watchDuration / totalDuration, 1);

      // Store cumulative watch time for this video
      if (!videoWatchTimes.current[videoId]) {
        videoWatchTimes.current[videoId] = 0;
      }
      videoWatchTimes.current[videoId] += watchDuration;

      trackEngagement('watch_time', videoId, {
        duration: watchDuration,
        completionRate: completionRate,
        totalWatchTime: videoWatchTimes.current[videoId]
      });

      console.log(`Video ${videoId} watched for ${watchDuration}s (${(completionRate * 100).toFixed(1)}% complete)`);
    }
  };

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

  const likeVideo = async () => {
    const currentVideo = videos[currentVideoIndex];
    if (currentVideo) {
      await trackEngagement('like', currentVideo.id);
    }
  };

  const commentVideo = async () => {
    const currentVideo = videos[currentVideoIndex];
    if (currentVideo) {
      await trackEngagement('comment', currentVideo.id);
    }
  };

  const shareVideo = async () => {
    const currentVideo = videos[currentVideoIndex];
    if (currentVideo) {
      await trackEngagement('share', currentVideo.id);
    }
  };

  const saveVideo = async () => {
    const currentVideo = videos[currentVideoIndex];
    if (currentVideo) {
      await trackEngagement('save', currentVideo.id);
    }
  };

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
    return (
      <view style={{ 
        padding: '20px', 
        paddingTop: '80px',
        backgroundColor: '#000', 
        minHeight: '100vh',
        color: 'white'
      }}>
        <text style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          textAlign: 'center',
          display: 'block',
          color: 'white'
        }}>TikTok Value Sharing Demo</text>
        
        <text style={{
          fontSize: '14px',
          textAlign: 'center',
          display: 'block',
          color: '#888',
          marginBottom: '20px'
        }}>
          {videos.length} videos loaded from server
        </text>
        
        <view 
          bindtap={() => setShowMenu(false)}
          style={{
            backgroundColor: '#ff0050',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center'
          }}
        >
          <text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            Start Watching Videos
          </text>
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
            // display: 'inline-block'
          }}
        >
          <text style={{ color: 'white' }}>Retry</text>
        </view>
      </view>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <CreatorConsumerSwitch videos={videos}>
      <view style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        color: 'white',
        position: 'relative'
      }}>
        {/* Back button */}
        <view
          bindtap={() => setShowMenu(true)}
          style={{
            position: 'absolute',
            top: '52px',
            left: '20px',
            zIndex: 10,
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '10px',
            borderRadius: '20px'
          }}
        >
          <text style={{ color: 'white' }}>Back</text>
        </view>

        {/* Video content */}
        <view style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, #ff6b6b, #4ecdc4)`
        }}>
          <view style={{ textAlign: 'center' }}>
            <text style={{ fontSize: '48px', marginBottom: '20px' }}>📱</text>
            <text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: 'white' }}>
              {currentVideo.author}
            </text>
            <text style={{ fontSize: '14px', marginBottom: '20px', color: 'white' }}>
              {currentVideo.description}
            </text>
            <text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              👁 {currentVideo.views || 0} views
            </text>
          </view>
        </view>

        {/* Action buttons */}
        <view style={{
          position: 'absolute',
          right: '20px',
          bottom: '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          alignItems: 'center'
        }}>
          <view
            bindtap={likeVideo}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '12px',
              borderRadius: '30px',
              textAlign: 'center',
              minWidth: '60px'
            }}
          >
            <text style={{ fontSize: '24px', color: 'white' }}>♥</text>
            <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
              {currentVideo.likes || 0}
            </text>
          </view>

          <view
            bindtap={commentVideo}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '12px',
              borderRadius: '30px',
              textAlign: 'center',
              minWidth: '60px'
            }}
          >
            <text style={{ fontSize: '24px', color: 'white' }}>💬</text>
            <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
              {currentVideo.comments || 0}
            </text>
          </view>

          <view
            bindtap={shareVideo}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '12px',
              borderRadius: '30px',
              textAlign: 'center',
              minWidth: '60px'
            }}
          >
            <text style={{ fontSize: '24px', color: 'white' }}>↗</text>
            <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
              {currentVideo.shares || 0}
            </text>
          </view>

          <view
            bindtap={saveVideo}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '12px',
              borderRadius: '30px',
              textAlign: 'center',
              minWidth: '60px'
            }}
          >
            <text style={{ fontSize: '24px', color: 'white' }}>🔖</text>
            <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
              {currentVideo.saves || 0}
            </text>
          </view>
        </view>

        {/* Next video button */}
        <view
          bindtap={() => setCurrentVideoIndex((prev) => (prev + 1) % videos.length)}
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
    </CreatorConsumerSwitch>
  );
}
