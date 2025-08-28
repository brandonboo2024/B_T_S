import { useState } from '@lynx-js/react';

export default function WrappedApp() {
  const [videos] = useState([
    { id: 1, author: '@johndoe', description: 'Amazing dance moves!', likes: 15200, comments: 892 },
    { id: 2, author: '@janesmith', description: 'Cooking hack', likes: 8900, comments: 445 },
    { id: 3, author: '@funnyguy', description: 'Hilarious cat video', likes: 25600, comments: 1205 }
  ]);
  
  const [showMenu, setShowMenu] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showCreator, setShowCreator] = useState(false);

  if (showMenu) {
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

  if (showCreator) {
    const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
    const totalRevenue = videos.reduce((sum, v) => {
      const revenue = 0.55 * (v.likes + 2 * v.comments) * 0.015;
      return sum + revenue;
    }, 0);

    return (
      <view style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px', paddingTop: '50px' }}>
        <view style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <text style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
            Creator Dashboard
          </text>
          <view 
            bindtap={() => setShowCreator(false)}
            style={{ padding: '10px', backgroundColor: '#ddd', borderRadius: '5px' }}
          >
            <text style={{ color: '#000' }}>Close</text>
          </view>
        </view>
        
        <view style={{ marginBottom: '20px' }}>
          <text style={{ color: '#000' }}>Total Likes: {totalLikes.toLocaleString()}</text>
          <text style={{ color: '#000', display: 'block' }}>Est Revenue: ${totalRevenue.toFixed(2)}</text>
        </view>

        {videos.map((video) => (
          <view key={video.id} style={{ 
            padding: '10px', 
            borderBottom: '1px solid #eee',
            marginBottom: '10px'
          }}>
            <text style={{ color: '#000', fontWeight: 'bold' }}>{video.author}</text>
            <text style={{ color: '#666', display: 'block' }}>{video.description}</text>
            <text style={{ color: '#000', display: 'block' }}>
              {video.likes.toLocaleString()} likes, {video.comments} comments
            </text>
          </view>
        ))}
      </view>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <view style={{ 
      backgroundColor: '#000', 
      minHeight: '100vh', 
      color: 'white',
      position: 'relative'
    }}>
      <view 
        bindtap={() => setShowMenu(true)}
        style={{
          position: 'absolute',
          top: '65px',
          left: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '10px',
          borderRadius: '20px'
        }}
      >
        <text style={{ color: 'white' }}>Back</text>
      </view>

      <view 
        bindtap={() => setShowCreator(true)}
        style={{
          position: 'absolute',
          top: '65px',
          right: '20px',
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px 12px',
          borderRadius: '20px'
        }}
      >
        <text style={{ color: '#000', fontSize: '12px' }}>Creator Mode</text>
      </view>

      <view style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)'
      }}>
        <view style={{ textAlign: 'center' }}>
          <text style={{ fontSize: '48px', marginBottom: '20px' }}>📱</text>
          <text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            {currentVideo.author}
          </text>
          <text style={{ fontSize: '14px', marginBottom: '20px' }}>
            {currentVideo.description}
          </text>
        </view>
      </view>

      <view style={{
        position: 'absolute',
        right: '20px',
        bottom: '120px'
      }}>
        <view style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '10px',
          borderRadius: '25px',
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <text style={{ fontSize: '20px' }}>♥</text>
          <text style={{ fontSize: '12px', display: 'block' }}>
            {currentVideo.likes.toLocaleString()}
          </text>
        </view>
      </view>

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
  );
}