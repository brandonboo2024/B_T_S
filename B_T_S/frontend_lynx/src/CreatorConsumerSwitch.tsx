// Enhanced CreatorConsumerSwitch.tsx with real revenue data
import { useMemo, useState, useEffect } from '@lynx-js/react';

export type VideoMeta = {
  id: number;
  title?: string;
  author?: string;
  creator?: string;
  likes?: number | string;
  comments?: number | string;
  shares?: number;
  saves?: number;
  views?: number;
  qualityScore?: number;
  estimatedRevenue?: string;
  platformRevenue?: string;
  creatorCredit?: string;
  flagged?: boolean;
  category?: string;
  totalWatchTime?: number;
};

type AnalyticsData = {
  platform: {
    totalRevenue: string;
    creatorPayouts: string;
    platformRetention: string;
    retentionPercent: string;
  };
  content: {
    totalVideos: number;
    flaggedVideos: number;
    avgQualityScore: string;
    totalWatchTime: string;
    categoryPerformance: {
      [key: string]: {
        videos: number;
        avgQuality: number;
        totalRevenue: number;
      };
    };
  };
  creators: {
    total: number;
    suspended: number;
    avgCreditScore: string;
  };
};

const API_BASE_URL = 'http://192.168.1.124:3001'; // Update with your IP

function toNum(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export default function CreatorConsumerSwitch({
  children,
  videos = [],
}: {
  children: any;
  videos?: VideoMeta[];
}) {
  const [mode, setMode] = useState<'consumer' | 'creator'>('consumer');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const safe = Array.isArray(videos) ? videos : [];

  // Fetch analytics data when entering creator mode
  useEffect(() => {
    if (mode === 'creator') {
      fetchAnalytics();
    }
  }, [mode]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const rows = useMemo(
    () =>
      safe.map((v) => ({
        ...v,
        likes: toNum(v.likes),
        comments: toNum(v.comments),
        shares: toNum(v.shares || 0),
        saves: toNum(v.saves || 0),
        views: toNum(v.views || 0),
        revenue: parseFloat(v.estimatedRevenue || '0'),
        qualityScore: parseFloat(v.qualityScore || '0'),
        creatorCredit: parseFloat(v.creatorCredit || '0'),
      })),
    [safe]
  );

  return (
    <view style={{ position: 'relative', minHeight: '100vh' }}>
      <view>{children}</view>

      {/* Toggle pill */}
      <view
        bindtap={() => setMode(mode === 'consumer' ? 'creator' : 'consumer')}
        style={{
          position: 'fixed',
          top: '56px',
          right: '20px',
          zIndex: 2147483647,
          padding: '8px 14px',
          borderRadius: '999px',
          border: '1px solid rgba(0,0,0,0.15)',
          backgroundColor: 'rgba(255,255,255,0.95)',
        }}
      >
        <text style={{ color: '#000', fontSize: '14px', fontWeight: '600' }}>
          {mode === 'consumer' ? 'Creator Mode' : 'Consumer Mode'}
        </text>
      </view>

      {mode === 'creator' && (
        <CreatorOverlay 
          rows={rows} 
          analytics={analytics}
          onClose={() => setMode('consumer')} 
        />
      )}
    </view>
  );
}

function CreatorOverlay({
  rows,
  analytics,
  onClose,
}: {
  rows: Array<VideoMeta & { revenue: number; qualityScore: number; creatorCredit: number }>;
  analytics: AnalyticsData | null;
  onClose: () => void;
}) {
  const totalViews = rows.reduce((a, r) => a + toNum(r.views), 0);
  const totalLikes = rows.reduce((a, r) => a + toNum(r.likes), 0);
  const totalComments = rows.reduce((a, r) => a + toNum(r.comments), 0);
  const totalCreatorRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const totalPlatformRevenue = rows.reduce((a, r) => a + parseFloat(r.platformRevenue || '0'), 0);
  const avgQuality = rows.length > 0 
    ? rows.reduce((a, r) => a + r.qualityScore, 0) / rows.length 
    : 0;
  const totalWatchTime = rows.reduce((a, r) => a + (r.totalWatchTime || 0), 0);

  return (
    <view
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 2147483000,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}
    >
      <view
        bindtap={onClose}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}
      />

      <view
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#fff',
          borderLeft: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '40px',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <view
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#fff',
          }}
        >
          <text style={{ fontWeight: '600', fontSize: '16px', color: '#111' }}>
            Creator Analytics Dashboard
          </text>
        </view>

        {/* Platform Analytics (if available) */}
        {analytics && (
          <view
            style={{
              padding: '12px 16px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #eee',
            }}
          >
            <text style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
              Platform Economics
            </text>
            <view style={{ display: 'flex', flexDirection: 'row', gap: '6px', marginBottom: '8px' }}>
              <Stat 
                label="Total Revenue" 
                value={formatCurrency(parseFloat(analytics.platform.totalRevenue))} 
              />
              <Stat 
                label="Creator Share" 
                value={formatCurrency(parseFloat(analytics.platform.creatorPayouts))} 
                highlight
              />
              <Stat 
                label="Platform %" 
                value={analytics.platform.retentionPercent} 
              />
            </view>
            
            {/* Fraud & Quality Metrics */}
            <view style={{ display: 'flex', flexDirection: 'row', gap: '6px' }}>
              <view style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: analytics.content.flaggedVideos > 0 ? '#ffebee' : '#e8f5e9',
                borderRadius: '6px',
                border: '1px solid ' + (analytics.content.flaggedVideos > 0 ? '#ffcdd2' : '#c8e6c9')
              }}>
                <text style={{ fontSize: '10px', color: '#666' }}>Flagged Content</text>
                <text style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: analytics.content.flaggedVideos > 0 ? '#d32f2f' : '#2e7d32' 
                }}>
                  {analytics.content.flaggedVideos}/{analytics.content.totalVideos}
                </text>
              </view>
              <view style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#fff3e0',
                borderRadius: '6px',
                border: '1px solid #ffe0b2'
              }}>
                <text style={{ fontSize: '10px', color: '#666' }}>Avg Quality</text>
                <text style={{ fontSize: '14px', fontWeight: '600', color: '#e65100' }}>
                  {(parseFloat(analytics.content.avgQualityScore) * 100).toFixed(1)}%
                </text>
              </view>
              <view style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: '#f3e5f5',
                borderRadius: '6px',
                border: '1px solid #e1bee7'
              }}>
                <text style={{ fontSize: '10px', color: '#666' }}>Watch Time</text>
                <text style={{ fontSize: '14px', fontWeight: '600', color: '#6a1b9a' }}>
                  {formatTime(parseFloat(analytics.content.totalWatchTime || '0'))}
                </text>
              </view>
            </view>
          </view>
        )}

        {/* Your Performance */}
        <view
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
          }}
        >
          <text style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
            Your Performance
          </text>
          <view style={{ display: 'flex', flexDirection: 'row', gap: '6px', marginBottom: '8px' }}>
            <Stat label="Views" value={formatNumber(totalViews)} />
            <Stat label="Engagement" value={formatNumber(totalLikes + totalComments)} />
            <Stat label="Watch Time" value={formatTime(totalWatchTime)} />
          </view>
          <view style={{
            padding: '10px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            border: '1px solid #c8e6c9'
          }}>
            <text style={{ fontSize: '11px', color: '#1b5e20', marginBottom: '4px' }}>
              Estimated Earnings
            </text>
            <text style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
              {formatCurrency(totalCreatorRevenue)}
            </text>
            <text style={{ fontSize: '10px', color: '#558b2f' }}>
              from {formatCurrency(totalPlatformRevenue)} platform revenue
            </text>
          </view>
        </view>

        {/* Quality Score Visualization */}
        <view
          style={{
            padding: '12px 16px',
            backgroundColor: '#fff8e1',
            borderBottom: '1px solid #eee',
          }}
        >
          <text style={{ fontSize: '12px', fontWeight: '600', color: '#f57c00', marginBottom: '4px' }}>
            Quality Score: {(avgQuality * 100).toFixed(1)}%
          </text>
          <view style={{
            height: '6px',
            backgroundColor: '#ffe0b2',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <view style={{
              height: '100%',
              width: `${avgQuality * 100}%`,
              backgroundColor: '#ff9800',
              transition: 'width 0.3s ease'
            }} />
          </view>
        </view>

        {/* Category Performance (if available) */}
        {analytics?.content?.categoryPerformance && 
         Object.keys(analytics.content.categoryPerformance).length > 0 && (
          <view style={{
            padding: '12px 16px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #eee'
          }}>
            <text style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
              Category Performance
            </text>
            <view style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(analytics.content.categoryPerformance).map(([cat, data]) => (
                <view key={cat} style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '4px 0'
                }}>
                  <text style={{ flex: 1, fontSize: '11px', color: '#333' }}>{cat}</text>
                  <text style={{ width: '40px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
                    {data.videos}v
                  </text>
                  <text style={{ 
                    width: '50px', 
                    textAlign: 'right', 
                    fontSize: '11px', 
                    fontWeight: '500',
                    color: data.avgQuality > 0.7 ? '#4caf50' : data.avgQuality > 0.4 ? '#ff9800' : '#f44336'
                  }}>
                    {(data.avgQuality * 100).toFixed(0)}%
                  </text>
                  <text style={{ width: '70px', textAlign: 'right', fontSize: '11px', color: '#000' }}>
                    {formatCurrency(data.totalRevenue)}
                  </text>
                </view>
              ))}
            </view>
          </view>
        )}

        {/* Video Performance Table */}
        <view style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
          <view style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '12px 0',
            borderBottom: '2px solid #333',
            fontWeight: '600',
            fontSize: '11px',
            color: '#666',
            position: 'sticky',
            top: 0,
            backgroundColor: '#fff'
          }}>
            <text style={{ flex: 1, color: '#666' }}>Video</text>
            <text style={{ width: '45px', textAlign: 'right', color: '#666' }}>Views</text>
            <text style={{ width: '45px', textAlign: 'right', color: '#666' }}>Likes</text>
            <text style={{ width: '50px', textAlign: 'right', color: '#666' }}>Quality</text>
            <text style={{ width: '50px', textAlign: 'right', color: '#666' }}>Credit</text>
            <text style={{ width: '70px', textAlign: 'right', color: '#666' }}>Revenue</text>
          </view>
          
          {rows.map((r, index) => (
            <view
              key={r.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #f2f2f2',
                backgroundColor: r.flagged ? '#ffebee' : 'transparent'
              }}
            >
              <view style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <text style={{ 
                  color: '#111', 
                  fontWeight: '500',
                  fontSize: '12px'
                }}>
                  {r.title || `Video ${index + 1}`}
                </text>
                <view style={{ display: 'flex', flexDirection: 'row', gap: '4px', marginTop: '2px' }}>
                  {r.category && (
                    <text style={{
                      fontSize: '9px',
                      color: '#666',
                      padding: '1px 4px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '3px'
                    }}>
                      {r.category}
                    </text>
                  )}
                  {r.flagged && (
                    <text style={{ 
                      color: '#d32f2f', 
                      fontSize: '9px',
                      padding: '1px 4px',
                      backgroundColor: '#ffcdd2',
                      borderRadius: '3px'
                    }}>
                      FLAGGED
                    </text>
                  )}
                </view>
              </view>
              <text style={{ width: '45px', textAlign: 'right', color: '#333', fontSize: '11px' }}>
                {formatNumber(r.views)}
              </text>
              <text style={{ width: '45px', textAlign: 'right', color: '#333', fontSize: '11px' }}>
                {formatNumber(r.likes)}
              </text>
              <text style={{ 
                width: '50px', 
                textAlign: 'right', 
                fontWeight: '500',
                fontSize: '11px',
                color: r.qualityScore > 0.7 ? '#4caf50' : r.qualityScore > 0.4 ? '#ff9800' : '#f44336'
              }}>
                {(r.qualityScore * 100).toFixed(0)}%
              </text>
              <text style={{ 
                width: '50px', 
                textAlign: 'right',
                fontSize: '11px',
                color: '#666'
              }}>
                {r.creatorCredit.toFixed(1)}/10
              </text>
              <text style={{ 
                width: '70px', 
                textAlign: 'right', 
                fontWeight: '600', 
                color: '#000',
                fontSize: '11px'
              }}>
                {formatCurrency(r.revenue)}
              </text>
            </view>
          ))}
        </view>
      </view>
    </view>
  );
}

// Add helper function for time formatting
function formatTime(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function Stat({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) {
  return (
    <view
      style={{
        flex: 1,
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '8px 10px',
        backgroundColor: highlight ? '#e8f5e9' : '#fafafa',
      }}
    >
      <text style={{ fontSize: '11px', color: '#777' }}>{label}</text>
      <text style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: highlight ? '#2e7d32' : '#000' 
      }}>
        {value}
      </text>
    </view>
  );
}

function formatNumber(n: any) {
  const num = Number(n);
  if (!isFinite(num)) return '0';
  const abs = Math.abs(num);

  if (abs >= 1e9) return (num / 1e9).toFixed(abs < 10e9 ? 1 : 0) + 'B';
  if (abs >= 1e6) return (num / 1e6).toFixed(abs < 10e6 ? 1 : 0) + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(abs < 10e3 ? 1 : 0) + 'K';

  const s = Math.round(num).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatCurrency(n: any) {
  let num = Number(n);
  if (!isFinite(num)) num = 0;
  const sign = num < 0 ? '-' : '';
  const s = Math.abs(num).toFixed(2);
  const [i, d] = s.split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${withCommas}.${d}`;
}
