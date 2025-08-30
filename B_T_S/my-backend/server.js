// Enhanced server.js with FIXED revenue calculation
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Constants for revenue calculation
const REVENUE_CONFIG = {
  // Revenue formula constants
  K_VIEWS: 0.00003,          // k for views
  K1_VIEWS: 0.001,           // k1 for log(views)
  K_WATCHTIME: 0.0000006,     // k for watchtime
  K1_WATCHTIME: 0.001,       // k1 for log(watchtime)
  
  MIN_CREATOR_SHARE: 0.30,
  MAX_CREATOR_SHARE: 0.70,
  CREDIT_BONUS_RATE: 0.05,
  
  // Fraud detection thresholds (statistical)
  ENGAGEMENT_ZSCORE_THRESHOLD: 3,    // 3 standard deviations
  VELOCITY_SPIKE_THRESHOLD: 5,       // 5x normal growth rate
  BOT_PATTERN_CONFIDENCE: 0.7,       // 70% confidence of bot behavior
  
  // Quality metrics weights
  ENGAGEMENT_WEIGHT: 0.35,
  WATCH_TIME_WEIGHT: 0.35,
  CONSISTENCY_WEIGHT: 0.20,
  CATEGORY_ADJUSTMENT_WEIGHT: 0.10,
  
  // Creator credit decay
  CREDIT_DECAY_FACTOR: 0.95,
  CONSISTENCY_BONUS: 1.1,
  
  // Platform historical data (for anomaly detection)
  HISTORICAL_STATS: {
    meanLikeRate: 0.08,
    stdLikeRate: 0.05,
    meanCommentRate: 0.02,
    stdCommentRate: 0.015,
    meanShareRate: 0.01,
    stdShareRate: 0.008,
    meanWatchCompletion: 0.45,
    stdWatchCompletion: 0.20
  }
};

// Content categories with expected engagement patterns
const CONTENT_CATEGORIES = {
  ENTERTAINMENT: { 
    expectedLikeRate: 0.15, 
    expectedCommentRate: 0.03,
    expectedCompletion: 0.50,
    advertiserScore: 0.8 
  },
  EDUCATIONAL: { 
    expectedLikeRate: 0.05, 
    expectedCommentRate: 0.02,
    expectedCompletion: 0.65,
    advertiserScore: 0.9
  },
  GAMING: { 
    expectedLikeRate: 0.10, 
    expectedCommentRate: 0.04,
    expectedCompletion: 0.40,
    advertiserScore: 0.7
  },
  LIFESTYLE: { 
    expectedLikeRate: 0.12, 
    expectedCommentRate: 0.025,
    expectedCompletion: 0.55,
    advertiserScore: 0.85
  }
};

// Enhanced data store
const dataStore = {
  videos: new Map(),
  engagements: [],
  creators: new Map(),
  watchSessions: new Map(),
  flaggedContent: new Set(),
  engagementHistory: new Map(), // Track engagement velocity
  metrics: {}
};

// Creator class with improved credit system
class Creator {
  constructor(id) {
    this.id = id;
    this.creditScore = 0;
    this.totalVideos = 0;
    this.totalRevenue = 0;
    this.recentScores = [];
    this.flaggedVideos = 0;
    this.suspended = false;
    this.lastUpdateTime = Date.now();
  }
  
  updateCredit(qualityScore) {
    // Time-weighted average with decay
    const timeSinceLastUpdate = (Date.now() - this.lastUpdateTime) / (1000 * 60 * 60 * 24); // days
    const timeDecay = Math.pow(REVENUE_CONFIG.CREDIT_DECAY_FACTOR, timeSinceLastUpdate);
    
    this.creditScore = (this.creditScore * timeDecay * REVENUE_CONFIG.CREDIT_DECAY_FACTOR) + 
                       (qualityScore * (1 - REVENUE_CONFIG.CREDIT_DECAY_FACTOR));
    
    this.recentScores.push(qualityScore);
    if (this.recentScores.length > 10) {
      this.recentScores.shift();
    }
    
    // Consistency bonus if last 5 videos all high quality
    const recentFive = this.recentScores.slice(-5);
    if (recentFive.length >= 5 && recentFive.every(s => s > 0.7)) {
      this.creditScore = Math.min(10, this.creditScore * REVENUE_CONFIG.CONSISTENCY_BONUS);
    }
    
    // Cap at 10
    this.creditScore = Math.min(10, Math.max(0, this.creditScore));
    this.lastUpdateTime = Date.now();
  }
}

// Initialize with enhanced video data
const initVideos = [
  { 
    id: 1, 
    author: '@johndoe', 
    description: 'Amazing dance moves!',
    category: 'ENTERTAINMENT', // Dummy category assignment
    duration: 60,
    likes: 15000, 
    comments: 2000, 
    views: 50000, 
    shares: 10000, 
    saves: 10000,
    reports: 14,
    watchTimes: [],
    totalWatchTime: 2000000,
    uniqueViewers: new Set(),
    // REMOVED: revenue: 0,  // Don't store revenue anymore
    qualityScore: 0,
    flagged: false,
    createdAt: Date.now()
  },
  { 
    id: 2, 
    author: '@janesmith', 
    description: 'Cooking hack',
    category: 'LIFESTYLE', // Dummy category assignment
    duration: 45,
    likes: 0, 
    comments: 0, 
    views: 0, 
    shares: 0, 
    saves: 0,
    reports: 0,
    watchTimes: [],
    totalWatchTime: 0,
    uniqueViewers: new Set(),
    // REMOVED: revenue: 0,  // Don't store revenue anymore
    qualityScore: 0,
    flagged: false,
    createdAt: Date.now()
  },
  { 
    id: 3, 
    author: '@funnyguy', 
    description: 'Hilarious cat video',
    category: 'ENTERTAINMENT', // Dummy category assignment
    duration: 15,
    likes: 0, 
    comments: 0, 
    views: 0, 
    shares: 0, 
    saves: 0,
    reports: 0,
    watchTimes: [],
    totalWatchTime: 0,
    uniqueViewers: new Set(),
    // REMOVED: revenue: 0,  // Don't store revenue anymore
    qualityScore: 0,
    flagged: false,
    createdAt: Date.now()
  }
];

initVideos.forEach(video => {
  dataStore.videos.set(video.id, video);
  dataStore.engagementHistory.set(video.id, []);
  if (!dataStore.creators.has(video.author)) {
    dataStore.creators.set(video.author, new Creator(video.author));
  }
});

app.use(cors({
  origin: ['http://192.168.1.124:3000', 'http://192.168.1.124:3001', 'http://192.168.1.124:5173'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running. Try /api/videos or /api/analytics');
});

// Calculate total platform revenue using new formula
function calculatePlatformRevenue(video) {
  const V = video.views || 0;
  const WT = video.totalWatchTime || 0;
  
  if (V === 0 && WT === 0) return 0;
  
  // (V * k)^0.5 + k1 * log10(V) + (WT * k)^0.5 + k1 * log10(WT)
  const viewComponent = V > 0 ? 
    Math.sqrt(V * REVENUE_CONFIG.K_VIEWS) + 
    REVENUE_CONFIG.K1_VIEWS * Math.log10(V + 1) : 0;
    
  const watchTimeComponent = WT > 0 ?
    Math.sqrt(WT * REVENUE_CONFIG.K_WATCHTIME) + 
    REVENUE_CONFIG.K1_WATCHTIME * Math.log10(WT + 1) : 0;
  
  const baseRevenue = viewComponent + watchTimeComponent;
  
  // Apply advertiser friendliness multiplier (dummy implementation)
  const advertiserMultiplier = getAdvertiserMultiplier(video);
  
  return baseRevenue * advertiserMultiplier;
}

// Content category normalization (dummy implementation)
function getCategoryAdjustment(video) {
  // DUMMY: In production, this would use AI/ML to categorize content
  const category = CONTENT_CATEGORIES[video.category] || CONTENT_CATEGORIES.ENTERTAINMENT;
  
  // Normalize engagement rates based on category expectations
  const actualLikeRate = video.views > 0 ? video.likes / video.views : 0;
  const expectedLikeRate = category.expectedLikeRate;
  
  // Return adjustment factor (0.5 to 1.5)
  const adjustment = Math.min(1.5, Math.max(0.5, actualLikeRate / expectedLikeRate));
  
  console.log(`Category ${video.category}: Expected like rate ${expectedLikeRate}, actual ${actualLikeRate.toFixed(3)}, adjustment ${adjustment.toFixed(2)}`);
  
  return adjustment;
}

// Advertiser friendliness score (dummy implementation)
function getAdvertiserMultiplier(video) {
  // DUMMY: In production, this would use AI to assess brand safety
  const category = CONTENT_CATEGORIES[video.category] || CONTENT_CATEGORIES.ENTERTAINMENT;
  const baseScore = category.advertiserScore;
  
  // DUMMY: Simulate some variance
  const variance = (Math.sin(video.id) * 0.1); // -0.1 to 0.1 variance
  const finalScore = Math.min(1, Math.max(0.5, baseScore + variance));
  
  // Convert to multiplier (0.5x to 2x revenue)
  const multiplier = 0.5 + (finalScore * 1.5);
  
  return multiplier;
}

// Calculate Z-score for anomaly detection
function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return Math.abs((value - mean) / stdDev);
}

// Detect engagement velocity spikes
function detectVelocitySpike(videoId, currentEngagement) {
  const history = dataStore.engagementHistory.get(videoId) || [];

  const video = dataStore.videos.get(videoId);
  if (video && video.views > 100000 && history.length < 2) {
    return false; // Don't flag established videos
  }
  
  if (history.length < 5) {
    history.push({
      timestamp: Date.now(),
      engagement: currentEngagement
    });
    dataStore.engagementHistory.set(videoId, history);
    return false;
  }
  
  // Calculate average growth rate
  const recentGrowth = history.slice(-5).map((h, i, arr) => {
    if (i === 0) return 0;
    const timeDiff = (h.timestamp - arr[i-1].timestamp) / 1000 / 60; // minutes
    const engagementDiff = h.engagement - arr[i-1].engagement;
    return timeDiff > 0 ? engagementDiff / timeDiff : 0;
  });
  
  const avgGrowth = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;
  const currentGrowth = history.length > 0 ? 
    (currentEngagement - history[history.length - 1].engagement) / 
    ((Date.now() - history[history.length - 1].timestamp) / 1000 / 60) : 0;
  
  history.push({
    timestamp: Date.now(),
    engagement: currentEngagement
  });
  
  if (history.length > 20) history.shift();
  dataStore.engagementHistory.set(videoId, history);
  
  return avgGrowth > 0 && currentGrowth > avgGrowth * REVENUE_CONFIG.VELOCITY_SPIKE_THRESHOLD;
}

// Detect bot patterns in watch times
function detectBotPatterns(watchTimes) {
  if (watchTimes.length < 10) return 0;
  
  // Check for suspiciously regular intervals
  const buckets = {};
  watchTimes.forEach(time => {
    const bucket = Math.round(time * 2) / 2; // 0.5 second buckets
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  });
  
  // Calculate entropy (randomness)
  const total = watchTimes.length;
  let entropy = 0;
  Object.values(buckets).forEach(count => {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  });
  
  // Low entropy suggests bot behavior
  const maxEntropy = Math.log2(Object.keys(buckets).length);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1;
  
  // Return confidence of bot behavior (0 to 1)
  return Math.max(0, 1 - normalizedEntropy);
}

// Enhanced fraud detection
function detectFraud(video) {
  const flags = [];
  let riskScore = 0;
  
  if (video.views === 0) return { flagged: false, reasons: [], riskScore: 0 };
  
  // Statistical anomaly detection
  const stats = REVENUE_CONFIG.HISTORICAL_STATS;
  
  // Z-score based detection
  const likeRate = video.likes / video.views;
  const likeZScore = calculateZScore(likeRate, stats.meanLikeRate, stats.stdLikeRate);
  if (likeZScore > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) {
    flags.push(`Anomalous like rate: ${(likeRate * 100).toFixed(1)}% (${likeZScore.toFixed(1)}σ)`);
    riskScore += likeZScore / 10;
  }
  
  const commentRate = video.comments / video.views;
  const commentZScore = calculateZScore(commentRate, stats.meanCommentRate, stats.stdCommentRate);
  if (commentZScore > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) {
    flags.push(`Anomalous comment rate: ${(commentRate * 100).toFixed(1)}% (${commentZScore.toFixed(1)}σ)`);
    riskScore += commentZScore / 10;
  }
  
  // Velocity spike detection
  const totalEngagement = video.likes + video.comments + video.shares + video.saves;
  if (detectVelocitySpike(video.id, totalEngagement)) {
    flags.push('Suspicious engagement velocity spike detected');
    riskScore += 0.3;
  }
  
  // Bot pattern detection
  const botConfidence = detectBotPatterns(video.watchTimes);
  if (botConfidence > REVENUE_CONFIG.BOT_PATTERN_CONFIDENCE) {
    flags.push(`Bot-like watch patterns detected (${(botConfidence * 100).toFixed(0)}% confidence)`);
    riskScore += botConfidence * 0.5;
  }
  
  // Watch completion anomalies
  if (video.watchTimes.length > 0) {
    const avgCompletion = video.watchTimes.reduce((a, b) => a + b, 0) / 
                         (video.watchTimes.length * video.duration);
    const completionZScore = calculateZScore(
      avgCompletion, 
      stats.meanWatchCompletion, 
      stats.stdWatchCompletion
    );
    
    if (completionZScore > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) {
      flags.push(`Unusual watch completion: ${(avgCompletion * 100).toFixed(1)}%`);
      riskScore += completionZScore / 15;
    }
  }
  
  return {
    flagged: riskScore > 0.5 || flags.length > 2,
    reasons: flags,
    riskScore: Math.min(1, riskScore)
  };
}

// Calculate video quality score with category adjustment
function calculateQualityScore(video) {
  if (video.views === 0) return 0;
  
  // Engagement quality
  const engagementScore = Math.min(1, 
    (video.likes + video.comments * 2 + video.shares * 1.5 + video.saves * 1.5) / 
    (video.views * 4)
  );
  
  // Watch time quality
  const avgWatchTime = video.watchTimes.length > 0 
    ? video.watchTimes.reduce((a, b) => a + b, 0) / video.watchTimes.length 
    : 0;
  const completionRate = video.duration > 0 ? avgWatchTime / video.duration : 0;
  
  // Category-adjusted score
  const categoryAdjustment = getCategoryAdjustment(video);
  
  // Consistency (inverse of variance in watch times)
  let consistencyScore = 1;
  if (video.watchTimes.length > 2) {
    const mean = avgWatchTime;
    const variance = video.watchTimes.reduce((sum, time) => 
      sum + Math.pow(time - mean, 2), 0) / video.watchTimes.length;
    const stdDev = Math.sqrt(variance);
    consistencyScore = Math.max(0, 1 - (stdDev / video.duration));
  }
  
  const qualityScore = (
    engagementScore * REVENUE_CONFIG.ENGAGEMENT_WEIGHT +
    completionRate * REVENUE_CONFIG.WATCH_TIME_WEIGHT +
    consistencyScore * REVENUE_CONFIG.CONSISTENCY_WEIGHT +
    categoryAdjustment * REVENUE_CONFIG.CATEGORY_ADJUSTMENT_WEIGHT
  );
  
  return Math.min(1, qualityScore);
}

// Calculate creator's share
function calculateCreatorShare(video, creator) {
  const qualityScore = calculateQualityScore(video);
  const creditBonus = (creator.creditScore / 10) * REVENUE_CONFIG.CREDIT_BONUS_RATE;
  
  const sharePercentage = Math.min(
    REVENUE_CONFIG.MAX_CREATOR_SHARE,
    REVENUE_CONFIG.MIN_CREATOR_SHARE + 
    (qualityScore * 0.35) +
    creditBonus
  );
  
  return sharePercentage;
}

// NEW: Function to calculate current creator revenue for a video
function calculateCurrentCreatorRevenue(video) {
  const platformRevenue = calculatePlatformRevenue(video);
  const creator = dataStore.creators.get(video.author) || new Creator(video.author);
  const creatorSharePercent = calculateCreatorShare(video, creator);
  return platformRevenue * creatorSharePercent;
}

// Main engagement endpoint
app.post('/api/engagement', (req, res) => {
  const { videoId, type, userId = 'anonymous', duration, completionRate } = req.body;
  
  if (!videoId || !type) {
    return res.status(400).json({ error: 'Missing videoId or type' });
  }
  
  const video = dataStore.videos.get(videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
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
  
  // Update video metrics
  switch(type) {
    case 'like': 
      video.likes = (video.likes || 0) + 1; 
      break;
    case 'comment': 
      video.comments = (video.comments || 0) + 1; 
      break;
    case 'view': 
      video.views = (video.views || 0) + 1;
      break;
    case 'share': 
      video.shares = (video.shares || 0) + 1; 
      break;
    case 'save': 
      video.saves = (video.saves || 0) + 1; 
      break;
    case 'watch_time':
      if (duration) {
        video.watchTimes.push(duration);
        video.totalWatchTime += duration;
      }
      break;
  }
  
  // Calculate revenue DYNAMICALLY (not stored)
  const platformRevenue = calculatePlatformRevenue(video);
  const creator = dataStore.creators.get(video.author) || new Creator(video.author);
  const creatorSharePercent = calculateCreatorShare(video, creator);
  const creatorRevenue = platformRevenue * creatorSharePercent;
  
  video.qualityScore = calculateQualityScore(video);
  
  // Update creator credit and total revenue
  creator.updateCredit(video.qualityScore);
  // NOTE: We're not adding to totalRevenue here anymore since it's calculated dynamically
  creator.totalVideos = Math.max(creator.totalVideos, 1);
  
  // Enhanced fraud detection
  const fraudCheck = detectFraud(video);
  if (fraudCheck.flagged) {
    video.flagged = true;
    dataStore.flaggedContent.add(videoId);
    creator.flaggedVideos++;
    
    // Suspend creator if too many flags
    const flagRate = creator.flaggedVideos / creator.totalVideos;
    if (creator.flaggedVideos > 3 || flagRate > 0.5) {
      creator.suspended = true;
      console.warn(`Creator ${video.author} suspended. Flagged: ${creator.flaggedVideos}, Rate: ${(flagRate * 100).toFixed(1)}%`);
    }
    
    console.warn(`Video ${videoId} flagged (risk: ${fraudCheck.riskScore.toFixed(2)}):`, fraudCheck.reasons);
  }
  
  dataStore.videos.set(videoId, video);
  dataStore.creators.set(video.author, creator);
  
  res.json({ 
    success: true,
    engagement,
    currentStats: {
      ...video,
      platformRevenue: platformRevenue.toFixed(3),
      creatorRevenue: creatorRevenue.toFixed(3),
      creatorSharePercent: (creatorSharePercent * 100).toFixed(1) + '%',
      qualityScore: video.qualityScore.toFixed(3),
      flagged: video.flagged,
      fraudRiskScore: fraudCheck.riskScore.toFixed(2)
    },
    creator: {
      creditScore: creator.creditScore.toFixed(2),
      totalRevenue: creator.totalRevenue.toFixed(2),
      suspended: creator.suspended
    }
  });
});

// FIXED: Get videos endpoint - calculate revenue dynamically
app.get('/api/videos', (req, res) => {
  const videos = Array.from(dataStore.videos.values()).map(video => {
    const creator = dataStore.creators.get(video.author);
    const creatorRevenue = calculateCurrentCreatorRevenue(video);
    const platformRevenue = calculatePlatformRevenue(video);
    
    return {
      ...video,
      creatorCredit: creator ? creator.creditScore.toFixed(1) : '0.0',
      estimatedRevenue: creatorRevenue.toFixed(3), // FIXED: Calculate dynamically
      platformRevenue: platformRevenue.toFixed(3)  // FIXED: Calculate dynamically
    };
  });
  
  res.json({
    success: true,
    data: videos,
    timestamp: new Date().toISOString()
  });
});

// FIXED: Analytics endpoint - calculate revenue dynamically
app.get('/api/analytics', (req, res) => {
  const videos = Array.from(dataStore.videos.values());
  const creators = Array.from(dataStore.creators.values());
  
  const totalPlatformRevenue = videos.reduce((sum, v) => 
    sum + calculatePlatformRevenue(v), 0
  );
  const totalCreatorRevenue = videos.reduce((sum, v) => 
    sum + calculateCurrentCreatorRevenue(v), 0  // FIXED: Calculate dynamically
  );
  const platformRetention = totalPlatformRevenue - totalCreatorRevenue;
  
  // Calculate category performance
  const categoryStats = {};
  Object.keys(CONTENT_CATEGORIES).forEach(cat => {
    const catVideos = videos.filter(v => v.category === cat);
    if (catVideos.length > 0) {
      categoryStats[cat] = {
        videos: catVideos.length,
        avgQuality: catVideos.reduce((sum, v) => sum + v.qualityScore, 0) / catVideos.length,
        totalRevenue: catVideos.reduce((sum, v) => sum + calculateCurrentCreatorRevenue(v), 0) // FIXED
      };
    }
  });
  
  res.json({
    platform: {
      totalRevenue: totalPlatformRevenue.toFixed(2),
      creatorPayouts: totalCreatorRevenue.toFixed(2),
      platformRetention: platformRetention.toFixed(2),
      retentionPercent: totalPlatformRevenue > 0 ? 
        ((platformRetention / totalPlatformRevenue) * 100).toFixed(1) + '%' : '0%'
    },
    content: {
      totalVideos: videos.length,
      flaggedVideos: dataStore.flaggedContent.size,
      avgQualityScore: videos.length > 0 ?
        (videos.reduce((sum, v) => sum + v.qualityScore, 0) / videos.length).toFixed(3) : '0',
      totalWatchTime: videos.reduce((sum, v) => sum + v.totalWatchTime, 0).toFixed(0),
      categoryPerformance: categoryStats
    },
    creators: {
      total: creators.length,
      suspended: creators.filter(c => c.suspended).length,
      avgCreditScore: creators.length > 0 ?
        (creators.reduce((sum, c) => sum + c.creditScore, 0) / creators.length).toFixed(2) : '0'
    }
  });
});

// Debug endpoint
app.get('/api/debug/engagements', (req, res) => {
  res.json({
    engagements: dataStore.engagements.slice(-50), // Last 50 engagements
    videos: Array.from(dataStore.videos.values()),
    creators: Array.from(dataStore.creators.entries()).map(([id, creator]) => ({
      id,
      ...creator
    })),
    flaggedContent: Array.from(dataStore.flaggedContent),
    config: {
      revenueFormula: '√(V×k) + k₁×log(V) + √(WT×k) + k₁×log(WT)',
      constants: {
        k_views: REVENUE_CONFIG.K_VIEWS,
        k1_views: REVENUE_CONFIG.K1_VIEWS,
        k_watchtime: REVENUE_CONFIG.K_WATCHTIME,
        k1_watchtime: REVENUE_CONFIG.K1_WATCHTIME
      }
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Enhanced Value-Sharing Server running on http://0.0.0.0:${port}`);
  console.log(`Access from other devices: http://[YOUR-IP]:${port}`);
});
