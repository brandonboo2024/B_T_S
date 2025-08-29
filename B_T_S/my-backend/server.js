// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// In-memory data store
const dataStore = {
  videos: new Map(),
  engagements: [],
  metrics: {}
};

// Initialize videos with your mock data
const initVideos = [
  { id: 1, author: '@johndoe', description: 'Amazing dance moves!', likes: 0, comments: 0, views: 0, shares: 0, saves: 0 },
  { id: 2, author: '@janesmith', description: 'Cooking hack', likes: 0, comments: 0, views: 0, shares: 0, saves: 0 },
  { id: 3, author: '@funnyguy', description: 'Hilarious cat video', likes: 0, comments: 0, views: 0, shares: 0, saves: 0 }
];

initVideos.forEach(video => {
  dataStore.videos.set(video.id, video);
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend API is running!',
    status: 'success',
    endpoints: {
      videos: '/api/videos',
      engagement: '/api/engagement'
    }
  });
});

// Get videos with current like counts
app.get('/api/videos', (req, res) => {
  const videos = Array.from(dataStore.videos.values());
  res.json({
    success: true,
    data: videos,
    timestamp: new Date().toISOString()
  });
});

// Track engagement (likes, views, etc)
// In your server.js, update the engagement endpoint:

app.post('/api/engagement', (req, res) => {
  const { videoId, type, userId = 'anonymous', duration, completionRate } = req.body;
  
  if (!videoId || !type) {
    return res.status(400).json({ error: 'Missing videoId or type' });
  }
  
  const engagement = {
    videoId,
    type,
    userId,
    timestamp: Date.now(),
    ...(duration && { duration }),
    ...(completionRate && { completionRate })
  };
  
  dataStore.engagements.push(engagement);
  
  const video = dataStore.videos.get(videoId);
  if (video) {
    // Initialize all metrics
    video.likes = video.likes || 0;
    video.comments = video.comments || 0;
    video.views = video.views || 0;
    video.shares = video.shares || 0;
    video.saves = video.saves || 0;
    video.totalWatchTime = video.totalWatchTime || 0;
    video.completionRates = video.completionRates || [];
    
    // Update based on type
    switch(type) {
      case 'like': video.likes += 1; break;
      case 'comment': video.comments += 1; break;
      case 'view': video.views += 1; break;
      case 'share': video.shares += 1; break;
      case 'save': video.saves += 1; break;
      case 'watch_time':
        video.totalWatchTime += duration || 0;
        if (completionRate !== undefined) {
          video.completionRates.push(completionRate);
        }
        break;
    }
    
    dataStore.videos.set(videoId, video);
  }
  
  console.log(`Engagement: ${type} on video ${videoId}`, engagement);
  
  res.json({ 
    success: true, 
    engagement,
    currentStats: video
  });
});

// Get engagement data for debugging
app.get('/api/debug/engagements', (req, res) => {
  res.json({
    engagements: dataStore.engagements,
    videos: Array.from(dataStore.videos.values())
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Access from other devices: http://[YOUR-IP]:${port}`);
});

