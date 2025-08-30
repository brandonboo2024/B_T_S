// server.js — clean merged (no duplicate declarations)
// Run: node server.js

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// ---------------------------------------------------------
// Config/constants
// ---------------------------------------------------------
const REVENUE_CONFIG = {
  K_VIEWS: 0.00003,
  K1_VIEWS: 0.001,
  K_WATCHTIME: 0.0000006,
  K1_WATCHTIME: 0.001,

  MIN_CREATOR_SHARE: 0.30,
  MAX_CREATOR_SHARE: 0.70,
  CREDIT_BONUS_RATE: 0.05,

  ENGAGEMENT_ZSCORE_THRESHOLD: 3,
  VELOCITY_SPIKE_THRESHOLD: 5,
  BOT_PATTERN_CONFIDENCE: 0.7,

  ENGAGEMENT_WEIGHT: 0.35,
  WATCH_TIME_WEIGHT: 0.35,
  CONSISTENCY_WEIGHT: 0.20,
  CATEGORY_ADJUSTMENT_WEIGHT: 0.10,

  CREDIT_DECAY_FACTOR: 0.95,
  CONSISTENCY_BONUS: 1.1,

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

const CONTENT_CATEGORIES = {
  ENTERTAINMENT: { expectedLikeRate: 0.15, expectedCommentRate: 0.03, expectedCompletion: 0.50, advertiserScore: 0.8 },
  EDUCATIONAL: { expectedLikeRate: 0.05, expectedCommentRate: 0.02, expectedCompletion: 0.65, advertiserScore: 0.9 },
  GAMING: { expectedLikeRate: 0.10, expectedCommentRate: 0.04, expectedCompletion: 0.40, advertiserScore: 0.7 },
  LIFESTYLE: { expectedLikeRate: 0.12, expectedCommentRate: 0.025, expectedCompletion: 0.55, advertiserScore: 0.85 }
};

// ---------------------------------------------------------
// Data store
// ---------------------------------------------------------
const dataStore = {
  videos: new Map(),
  engagements: [],
  creators: new Map(),
  watchSessions: new Map(),
  flaggedContent: new Set(),
  engagementHistory: new Map(),
  metrics: {},
  // Livestreams + donations
  livestreams: new Map(),
  streamDonations: new Map(), // Map<streamId, {count,total,creatorTotal,platformTotal}>
};

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
    const days = (Date.now() - this.lastUpdateTime) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.pow(REVENUE_CONFIG.CREDIT_DECAY_FACTOR, days);
    this.creditScore = (this.creditScore * timeDecay * REVENUE_CONFIG.CREDIT_DECAY_FACTOR) +
      (qualityScore * (1 - REVENUE_CONFIG.CREDIT_DECAY_FACTOR));
    this.recentScores.push(qualityScore);
    if (this.recentScores.length > 10) this.recentScores.shift();
    const recentFive = this.recentScores.slice(-5);
    if (recentFive.length >= 5 && recentFive.every(s => s > 0.7)) {
      this.creditScore = Math.min(10, this.creditScore * REVENUE_CONFIG.CONSISTENCY_BONUS);
    }
    this.creditScore = Math.min(10, Math.max(0, this.creditScore));
    this.lastUpdateTime = Date.now();
  }
}

// ---------------------------------------------------------
// Seed videos
// ---------------------------------------------------------
const initVideos = [
  {
    id: 1, author: '@johndoe', description: 'Amazing dance moves!', category: 'ENTERTAINMENT', duration: 60,
    likes: 15000, comments: 2000, views: 50000, shares: 10000, saves: 10000, reports: 14,
    watchTimes: [], totalWatchTime: 2_000_000, uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now()
  },
  {
    id: 2, author: '@janesmith', description: 'Cooking hack', category: 'LIFESTYLE', duration: 45,
    likes: 0, comments: 0, views: 0, shares: 0, saves: 0, reports: 0,
    watchTimes: [], totalWatchTime: 0, uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now()
  },
  {
    id: 3, author: '@funnyguy', description: 'Hilarious cat video', category: 'ENTERTAINMENT', duration: 15,
    likes: 0, comments: 0, views: 0, shares: 0, saves: 0, reports: 0,
    watchTimes: [], totalWatchTime: 0, uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now()
  }
];

initVideos.forEach(video => {
  dataStore.videos.set(video.id, video);
  dataStore.engagementHistory.set(video.id, []);
  if (!dataStore.creators.has(video.author)) {
    dataStore.creators.set(video.author, new Creator(video.author));
  }
});

// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------
app.use(cors({
  origin: ['http://192.168.1.16:3000', 'http://192.168.1.16:3001', 'http://192.168.1.16:5173'],
  credentials: true
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Server is running. Try /api/videos or /api/analytics');
});

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function getAdvertiserMultiplier(video) {
  const category = CONTENT_CATEGORIES[video.category] || CONTENT_CATEGORIES.ENTERTAINMENT;
  const baseScore = category.advertiserScore;
  const variance = (Math.sin(video.id) * 0.1);
  const finalScore = Math.min(1, Math.max(0.5, baseScore + variance));
  return 0.5 + (finalScore * 1.5);
}

function getCategoryAdjustment(video) {
  const category = CONTENT_CATEGORIES[video.category] || CONTENT_CATEGORIES.ENTERTAINMENT;
  const actualLikeRate = video.views > 0 ? video.likes / video.views : 0;
  const expectedLikeRate = category.expectedLikeRate;
  return Math.min(1.5, Math.max(0.5, expectedLikeRate > 0 ? actualLikeRate / expectedLikeRate : 1));
}

function calculatePlatformRevenue(video) {
  const V = video.views || 0;
  const WT = video.totalWatchTime || 0;
  if (V === 0 && WT === 0) return 0;
  const viewComponent = V > 0 ? Math.sqrt(V * REVENUE_CONFIG.K_VIEWS) + REVENUE_CONFIG.K1_VIEWS * Math.log10(V + 1) : 0;
  const watchTimeComponent = WT > 0 ? Math.sqrt(WT * REVENUE_CONFIG.K_WATCHTIME) + REVENUE_CONFIG.K1_WATCHTIME * Math.log10(WT + 1) : 0;
  const baseRevenue = viewComponent + watchTimeComponent;
  const advertiserMultiplier = getAdvertiserMultiplier(video);
  return baseRevenue * advertiserMultiplier;
}

function calculateZScore(value, mean, stdDev) { return stdDev === 0 ? 0 : Math.abs((value - mean) / stdDev); }

function detectVelocitySpike(videoId, currentEngagement) {
  const history = dataStore.engagementHistory.get(videoId) || [];
  const video = dataStore.videos.get(videoId);
  if (video && video.views > 100000 && history.length < 2) return false;
  if (history.length < 5) {
    history.push({ timestamp: Date.now(), engagement: currentEngagement });
    dataStore.engagementHistory.set(videoId, history);
    return false;
  }
  const recentGrowth = history.slice(-5).map((h, i, arr) => {
    if (i === 0) return 0;
    const timeDiff = (h.timestamp - arr[i - 1].timestamp) / 1000 / 60;
    const engagementDiff = h.engagement - arr[i - 1].engagement;
    return timeDiff > 0 ? engagementDiff / timeDiff : 0;
  });
  const avgGrowth = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;
  const last = history[history.length - 1];
  const currentGrowth = last ? (currentEngagement - last.engagement) / ((Date.now() - last.timestamp) / 1000 / 60) : 0;
  history.push({ timestamp: Date.now(), engagement: currentEngagement });
  if (history.length > 20) history.shift();
  dataStore.engagementHistory.set(videoId, history);
  return avgGrowth > 0 && currentGrowth > avgGrowth * REVENUE_CONFIG.VELOCITY_SPIKE_THRESHOLD;
}

function detectBotPatterns(watchTimes) {
  if (watchTimes.length < 10) return 0;
  const buckets = {};
  watchTimes.forEach(time => { const b = Math.round(time * 2) / 2; buckets[b] = (buckets[b] || 0) + 1; });
  const total = watchTimes.length;
  let entropy = 0;
  Object.values(buckets).forEach(count => { const p = count / total; if (p > 0) entropy -= p * Math.log2(p); });
  const maxEntropy = Math.log2(Object.keys(buckets).length);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1;
  return Math.max(0, 1 - normalizedEntropy);
}

function detectFraud(video) {
  const flags = []; let riskScore = 0;
  if (video.views === 0) return { flagged: false, reasons: [], riskScore: 0 };
  const stats = REVENUE_CONFIG.HISTORICAL_STATS;
  const likeRate = video.likes / video.views;
  const likeZ = calculateZScore(likeRate, stats.meanLikeRate, stats.stdLikeRate);
  if (likeZ > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) { flags.push(`Anomalous like rate`); riskScore += likeZ / 10; }
  const commentRate = video.comments / video.views;
  const commentZ = calculateZScore(commentRate, stats.meanCommentRate, stats.stdCommentRate);
  if (commentZ > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) { flags.push(`Anomalous comment rate`); riskScore += commentZ / 10; }
  const totalEng = video.likes + video.comments + video.shares + video.saves;
  if (detectVelocitySpike(video.id, totalEng)) { flags.push('Suspicious engagement velocity spike'); riskScore += 0.3; }
  const botConfidence = detectBotPatterns(video.watchTimes);
  if (botConfidence > REVENUE_CONFIG.BOT_PATTERN_CONFIDENCE) { flags.push('Bot-like watch patterns'); riskScore += botConfidence * 0.5; }
  if (video.watchTimes.length > 0) {
    const avgWT = video.watchTimes.reduce((a, b) => a + b, 0) / (video.watchTimes.length * video.duration);
    const compZ = calculateZScore(avgWT, stats.meanWatchCompletion, stats.stdWatchCompletion);
    if (compZ > REVENUE_CONFIG.ENGAGEMENT_ZSCORE_THRESHOLD) { flags.push('Unusual watch completion'); riskScore += compZ / 15; }
  }
  return { flagged: riskScore > 0.5 || flags.length > 2, reasons: flags, riskScore: Math.min(1, riskScore) };
}

function calculateQualityScore(video) {
  if (video.views === 0) return 0;
  const engagementScore = Math.min(1, (video.likes + video.comments * 2 + video.shares * 1.5 + video.saves * 1.5) / (video.views * 4));
  const avgWT = video.watchTimes.length > 0 ? video.watchTimes.reduce((a, b) => a + b, 0) / video.watchTimes.length : 0;
  const completionRate = video.duration > 0 ? avgWT / video.duration : 0;
  let consistencyScore = 1;
  if (video.watchTimes.length > 2) {
    const mean = avgWT;
    const variance = video.watchTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / video.watchTimes.length;
    const stdDev = Math.sqrt(variance);
    consistencyScore = Math.max(0, 1 - (stdDev / video.duration));
  }
  const categoryAdjustment = getCategoryAdjustment(video);
  const qualityScore = (
    engagementScore * REVENUE_CONFIG.ENGAGEMENT_WEIGHT +
    completionRate * REVENUE_CONFIG.WATCH_TIME_WEIGHT +
    consistencyScore * REVENUE_CONFIG.CONSISTENCY_WEIGHT +
    categoryAdjustment * REVENUE_CONFIG.CATEGORY_ADJUSTMENT_WEIGHT
  );
  return Math.min(1, qualityScore);
}

function calculateCreatorShare(video, creator) {
  const qualityScore = calculateQualityScore(video);
  const creditBonus = (creator.creditScore / 10) * REVENUE_CONFIG.CREDIT_BONUS_RATE;
  return Math.min(
    REVENUE_CONFIG.MAX_CREATOR_SHARE,
    REVENUE_CONFIG.MIN_CREATOR_SHARE + (qualityScore * 0.35) + creditBonus
  );
}

function calculateCurrentCreatorRevenue(video) {
  const platformRevenue = calculatePlatformRevenue(video);
  const creator = dataStore.creators.get(video.author) || new Creator(video.author);
  const creatorSharePercent = calculateCreatorShare(video, creator);
  return platformRevenue * creatorSharePercent;
}

// ---------------------------------------------------------
// Livestream seeding + helpers
// ---------------------------------------------------------
const initLivestreams = [
  {
    id: 101, author: '@livechef', description: 'Live: 10-minute ramen challenge 🍜', category: 'LIFESTYLE', duration: 300,
    likes: 1200, comments: 180, views: 4800, shares: 220, saves: 90, reports: 0, watchTimes: [], totalWatchTime: 180000,
    uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now(), isLive: true
  },
  {
    id: 102, author: '@pro_gamer', description: 'Live: speedrunning classics 🎮', category: 'GAMING', duration: 240,
    likes: 300, comments: 120, views: 2100, shares: 80, saves: 20, reports: 0, watchTimes: [], totalWatchTime: 72000,
    uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now(), isLive: true
  },
  {
    id: 103, author: '@EYEMASKAM', description: 'cleaning some dough iykyk', category: 'EDUCATION', duration: 240,
    likes: 1400, comments: 1100, views: 1500, shares: 1100, saves: 1450, reports: 200, watchTimes: [], totalWatchTime: 10000,
    uniqueViewers: new Set(), qualityScore: 0, flagged: false, createdAt: Date.now(), isLive: true
  },
];

initLivestreams.forEach((s) => {
  dataStore.livestreams.set(s.id, s);
  dataStore.engagementHistory.set(s.id, []);
  if (!dataStore.creators.has(s.author)) dataStore.creators.set(s.author, new Creator(s.author));
});

function getDonationInfo(streamId) {
  if (!dataStore.streamDonations.has(streamId)) {
    dataStore.streamDonations.set(streamId, { count: 0, total: 0, creatorTotal: 0, platformTotal: 0 });
  }
  return dataStore.streamDonations.get(streamId);
}

function splitDonation(stream) {
  const creator = dataStore.creators.get(stream.author) || new Creator(stream.author);
  const quality = Math.max(0, Math.min(1, calculateQualityScore(stream)));
  let platformShare = 0.25; // base
  platformShare -= 0.10 * quality;                 // reward quality
  platformShare -= 0.10 * (creator.creditScore / 10); // reward credit
  if (stream.flagged) platformShare += 0.25;       // penalize flagged
  platformShare = Math.max(0.10, Math.min(0.60, platformShare));
  return { platformShare, creatorShare: 1 - platformShare };
}

// ---------------------------------------------------------
// Endpoints — videos
// ---------------------------------------------------------
app.post('/api/engagement', (req, res) => {
  const { videoId, type, userId = 'anonymous', duration, completionRate } = req.body || {};
  if (!videoId || !type) return res.status(400).json({ error: 'Missing videoId or type' });
  const video = dataStore.videos.get(videoId);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const engagement = { videoId, type, userId, timestamp: Date.now(), ...(duration && { duration }), ...(completionRate && { completionRate }) };
  dataStore.engagements.push(engagement);

  switch (type) {
    case 'like': video.likes = (video.likes || 0) + 1; break;
    case 'comment': video.comments = (video.comments || 0) + 1; break;
    case 'view': video.views = (video.views || 0) + 1; break;
    case 'share': video.shares = (video.shares || 0) + 1; break;
    case 'save': video.saves = (video.saves || 0) + 1; break;
    case 'watch_time': if (duration) { video.watchTimes.push(duration); video.totalWatchTime += duration; } break;
  }

  const platformRevenue = calculatePlatformRevenue(video);
  const creator = dataStore.creators.get(video.author) || new Creator(video.author);
  const creatorSharePercent = calculateCreatorShare(video, creator);
  const creatorRevenue = platformRevenue * creatorSharePercent;
  video.qualityScore = calculateQualityScore(video);

  creator.updateCredit(video.qualityScore);
  creator.totalVideos = Math.max(creator.totalVideos, 1);

  const fraudCheck = detectFraud(video);
  if (fraudCheck.flagged) {
    video.flagged = true; dataStore.flaggedContent.add(videoId); creator.flaggedVideos++;
    const flagRate = creator.flaggedVideos / creator.totalVideos;
    if (creator.flaggedVideos > 3 || flagRate > 0.5) creator.suspended = true;
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
      fraudRiskScore: (fraudCheck.riskScore || 0).toFixed(2)
    },
    creator: {
      creditScore: creator.creditScore.toFixed(2),
      totalRevenue: creator.totalRevenue.toFixed(2),
      suspended: creator.suspended
    }
  });
});

app.get('/api/videos', (_req, res) => {
  const videos = Array.from(dataStore.videos.values()).map(video => {
    const creator = dataStore.creators.get(video.author);
    const creatorRevenue = calculateCurrentCreatorRevenue(video);
    const platformRevenue = calculatePlatformRevenue(video);
    return {
      ...video,
      creatorCredit: creator ? creator.creditScore.toFixed(1) : '0.0',
      estimatedRevenue: creatorRevenue.toFixed(3),
      platformRevenue: platformRevenue.toFixed(3)
    };
  });
  res.json({ success: true, data: videos, timestamp: new Date().toISOString() });
});

app.get('/api/analytics', (_req, res) => {
  const videos = Array.from(dataStore.videos.values());
  const creators = Array.from(dataStore.creators.values());
  const totalPlatformRevenue = videos.reduce((sum, v) => sum + calculatePlatformRevenue(v), 0);
  const totalCreatorRevenue = videos.reduce((sum, v) => sum + calculateCurrentCreatorRevenue(v), 0);
  const platformRetention = totalPlatformRevenue - totalCreatorRevenue;

  const categoryStats = {};
  Object.keys(CONTENT_CATEGORIES).forEach(cat => {
    const catVideos = videos.filter(v => v.category === cat);
    if (catVideos.length > 0) {
      categoryStats[cat] = {
        videos: catVideos.length,
        avgQuality: catVideos.reduce((s, v) => s + v.qualityScore, 0) / catVideos.length,
        totalRevenue: catVideos.reduce((s, v) => s + calculateCurrentCreatorRevenue(v), 0)
      };
    }
  });

  res.json({
    platform: {
      totalRevenue: totalPlatformRevenue.toFixed(2),
      creatorPayouts: totalCreatorRevenue.toFixed(2),
      platformRetention: platformRetention.toFixed(2),
      retentionPercent: totalPlatformRevenue > 0 ? ((platformRetention / totalPlatformRevenue) * 100).toFixed(1) + '%' : '0%'
    },
    content: {
      totalVideos: videos.length,
      flaggedVideos: dataStore.flaggedContent.size,
      avgQualityScore: videos.length > 0 ? (videos.reduce((s, v) => s + v.qualityScore, 0) / videos.length).toFixed(3) : '0',
      totalWatchTime: videos.reduce((s, v) => s + v.totalWatchTime, 0).toFixed(0),
      categoryPerformance: categoryStats
    },
    creators: {
      total: creators.length,
      suspended: creators.filter(c => c.suspended).length,
      avgCreditScore: creators.length > 0 ? (creators.reduce((s, c) => s + c.creditScore, 0) / creators.length).toFixed(2) : '0'
    }
  });
});

app.get('/api/debug/engagements', (_req, res) => {
  res.json({
    engagements: dataStore.engagements.slice(-50),
    videos: Array.from(dataStore.videos.values()),
    creators: Array.from(dataStore.creators.entries()).map(([id, c]) => ({ id, ...c })),
    flaggedContent: Array.from(dataStore.flaggedContent),
    config: {
      revenueFormula: '√(V×k) + k₁×log(V) + √(WT×k) + k₁×log(WT)',
      constants: { k_views: REVENUE_CONFIG.K_VIEWS, k1_views: REVENUE_CONFIG.K1_VIEWS, k_watchtime: REVENUE_CONFIG.K_WATCHTIME, k1_watchtime: REVENUE_CONFIG.K1_WATCHTIME }
    }
  });
});

// ---------------------------------------------------------
// Endpoints — livestreams
// ---------------------------------------------------------
app.get('/api/livestreams', (_req, res) => {
  const streams = Array.from(dataStore.livestreams.values()).map((stream) => {
    const creator = dataStore.creators.get(stream.author) || new Creator(stream.author);
    const basePlatformRevenue = calculatePlatformRevenue(stream);
    const creatorSharePercent = calculateCreatorShare(stream, creator);
    const creatorRevenueFromPlatform = basePlatformRevenue * creatorSharePercent;
    const d = getDonationInfo(stream.id);
    const estimatedRevenue = creatorRevenueFromPlatform + d.creatorTotal;
    const platformRevenue = basePlatformRevenue + d.platformTotal;
    return {
      ...stream,
      creatorCredit: creator ? creator.creditScore.toFixed(1) : '0.0',
      estimatedRevenue: estimatedRevenue.toFixed(3),
      platformRevenue: platformRevenue.toFixed(3),
      donationCount: d.count,
      donationCreatorTotal: d.creatorTotal.toFixed(2),
      donationPlatformTotal: d.platformTotal.toFixed(2)
    };
  });
  res.json({ success: true, data: streams, timestamp: new Date().toISOString() });
});

app.post('/api/livestreams/engagement', (req, res) => {
  const { streamId, type, userId = 'anonymous', duration, completionRate } = req.body || {};
  if (!streamId || !type) return res.status(400).json({ error: 'Missing streamId or type' });
  const stream = dataStore.livestreams.get(streamId);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });

  const engagement = { streamId, type, userId, timestamp: Date.now(), ...(duration && { duration }), ...(completionRate && { completionRate }) };
  dataStore.engagements.push(engagement);

  switch (type) {
    case 'like': stream.likes = (stream.likes || 0) + 1; break;
    case 'comment': stream.comments = (stream.comments || 0) + 1; break;
    case 'view': stream.views = (stream.views || 0) + 1; break;
    case 'share': stream.shares = (stream.shares || 0) + 1; break;
    case 'save': stream.saves = (stream.saves || 0) + 1; break;
    case 'watch_time': if (duration) { stream.watchTimes.push(duration); stream.totalWatchTime += duration; } break;
  }

  const platformRevenue = calculatePlatformRevenue(stream);
  const creator = dataStore.creators.get(stream.author) || new Creator(stream.author);
  const creatorSharePercent = calculateCreatorShare(stream, creator);
  const creatorRevenue = platformRevenue * creatorSharePercent;
  stream.qualityScore = calculateQualityScore(stream);

  const fraudCheck = detectFraud(stream);
  if (fraudCheck.flagged) { stream.flagged = true; dataStore.flaggedContent.add(streamId); creator.flaggedVideos++; }

  dataStore.livestreams.set(streamId, stream);
  dataStore.creators.set(stream.author, creator);

  const d = getDonationInfo(streamId);
  res.json({
    success: true, engagement, currentStats: {
      ...stream,
      platformRevenue: platformRevenue.toFixed(3),
      creatorRevenue: creatorRevenue.toFixed(3),
      creatorSharePercent: (creatorSharePercent * 100).toFixed(1) + '%',
      donationCount: d.count,
      donationCreatorTotal: d.creatorTotal.toFixed(2),
      donationPlatformTotal: d.platformTotal.toFixed(2),
      qualityScore: stream.qualityScore.toFixed(3),
      flagged: stream.flagged,
    }
  });
});

app.post('/api/livestreams/donate', (req, res) => {
  const { streamId, userId = 'anonymous', amount = 1 } = req.body || {};
  if (!streamId) return res.status(400).json({ error: 'Missing streamId' });
  const stream = dataStore.livestreams.get(streamId);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });

  const { platformShare, creatorShare } = splitDonation(stream);
  const creatorCut = +(amount * creatorShare).toFixed(2);
  const platformCut = +(amount - creatorCut).toFixed(2);

  const d = getDonationInfo(streamId);
  d.count += 1;
  d.total = +(d.total + amount).toFixed(2);
  d.creatorTotal = +(d.creatorTotal + creatorCut).toFixed(2);
  d.platformTotal = +(d.platformTotal + platformCut).toFixed(2);
  dataStore.streamDonations.set(streamId, d);

  const basePlatformRevenue = calculatePlatformRevenue(stream);
  const creator = dataStore.creators.get(stream.author) || new Creator(stream.author);
  const creatorSharePercent = calculateCreatorShare(stream, creator);
  const creatorRevenueFromPlatform = basePlatformRevenue * creatorSharePercent;
  const estimatedRevenue = creatorRevenueFromPlatform + d.creatorTotal;
  const platformRevenue = basePlatformRevenue + d.platformTotal;

  res.json({
    success: true, donation: {
      amount: +amount,
      creatorCut,
      platformCut,
      platformSharePercent: +(platformShare * 100).toFixed(1),
      creatorSharePercent: +(creatorShare * 100).toFixed(1)
    }, currentStats: {
      ...stream,
      estimatedRevenue: estimatedRevenue.toFixed(3),
      platformRevenue: platformRevenue.toFixed(3),
      donationCount: d.count,
      donationCreatorTotal: d.creatorTotal.toFixed(2),
      donationPlatformTotal: d.platformTotal.toFixed(2)
    }
  });
});

// ---------------------------------------------------------
// Listen
// ---------------------------------------------------------
app.listen(port, '0.0.0.0', () => {
  console.log(`Enhanced Value-Sharing Server running on http://0.0.0.0:${port}`);
  console.log(`Access from other devices: http://[YOUR-IP]:${port}`);
});

function calculateDonationSplit(stream) {
  const creator = dataStore.creators.get(stream.author) || new Creator(stream.author);
  
  // Base creator share starts at 45%
  let creatorShare = 0.45;
  
  // Quality metrics adjustments
  
  // 1. Interaction per viewer (up to +15%)
  if (stream.views > 0) {
    const interactionRate = (stream.likes + stream.comments + stream.shares) / stream.views;
    // Normal range 0-0.3, capped at 0.5
    const normalizedInteraction = Math.min(interactionRate / 0.3, 1);
    creatorShare += normalizedInteraction * 0.15;
  }
  
  // 2. Mean retention time (up to +10%)
  const avgWatchTime = stream.watchTimes.length > 0 
    ? stream.watchTimes.reduce((a,b) => a+b, 0) / stream.watchTimes.length 
    : 0;
  const retentionRate = stream.duration > 0 ? avgWatchTime / stream.duration : 0;
  creatorShare += Math.min(retentionRate, 1) * 0.10;
  
  // 3. Low report ratio (up to +5%)
  const reportRate = stream.views > 0 ? (stream.reports || 0) / stream.views : 0;
  if (reportRate < 0.01) { // Less than 1% reports
    creatorShare += 0.05 * (1 - (reportRate / 0.01));
  }
  
  // Penalties
  if (stream.flagged) {
    creatorShare -= 0.20; // Flagged content penalty
  }
  
  if (creator.suspended) {
    creatorShare -= 0.30; // Suspended creator penalty
  }
  
  // Fraud detection penalty
  const fraudCheck = detectFraud(stream);
  if (fraudCheck.flagged) {
    creatorShare -= fraudCheck.riskScore * 0.15; // Up to 15% penalty based on risk
  }
  
  // Apply floor and cap
  creatorShare = Math.max(0.15, Math.min(0.75, creatorShare));
  
  return {
    platformShare: 1 - creatorShare,
    creatorShare: creatorShare,
    breakdown: {
      base: 0.45,
      interactionBonus: normalizedInteraction * 0.15,
      retentionBonus: retentionRate * 0.10,
      reportBonus: reportRate < 0.01 ? 0.05 * (1 - (reportRate / 0.01)) : 0,
      penalties: (stream.flagged ? -0.20 : 0) + (creator.suspended ? -0.30 : 0),
      final: creatorShare
    }
  };
}

// Update the donation endpoint to return the breakdown
app.post('/api/livestreams/donate', (req, res) => {
  // ... existing validation code ...
  
  const split = calculateDonationSplit(stream);
  const creatorCut = +(amount * split.creatorShare).toFixed(2);
  const platformCut = +(amount - creatorCut).toFixed(2);
  
  // Update donation info
  const d = getDonationInfo(streamId);
  d.count += 1;
  d.total = +(d.total + amount).toFixed(2);
  d.creatorTotal = +(d.creatorTotal + creatorCut).toFixed(2);
  d.platformTotal = +(d.platformTotal + platformCut).toFixed(2);
  dataStore.streamDonations.set(streamId, d);
  
  // Calculate updated revenue
  const basePlatformRevenue = calculatePlatformRevenue(stream);
  const creatorSharePercent = calculateCreatorShare(stream, creator);
  const creatorRevenueFromPlatform = basePlatformRevenue * creatorSharePercent;
  const estimatedRevenue = creatorRevenueFromPlatform + d.creatorTotal;
  const platformRevenue = basePlatformRevenue + d.platformTotal;
  
  res.json({
    success: true,
    donation: {
      amount: +amount,
      creatorCut,
      platformCut,
      creatorSharePercent: +(split.creatorShare * 100).toFixed(1),
      platformSharePercent: +(split.platformShare * 100).toFixed(1),
      breakdown: split.breakdown // Include for transparency
    },
    currentStats: {
      ...stream,
      estimatedRevenue: estimatedRevenue.toFixed(3),
      platformRevenue: platformRevenue.toFixed(3),
      donationCount: d.count,
      donationCreatorTotal: d.creatorTotal.toFixed(2),
      donationPlatformTotal: d.platformTotal.toFixed(2)
    }
  });
});
