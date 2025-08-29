import { useMemo, useState } from '@lynx-js/react';

export type VideoMeta = {
  id: number;
  title?: string;
  creator?: string;
  likes?: number | string;
  comments?: number | string;
};

const CREATOR_SHARE = 0.55;
const VALUE_PER_ENGAGEMENT = 0.015;

function toNum(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function computeProposedRevenue(v: VideoMeta): number {
  const likes = toNum(v.likes);
  const comments = toNum(v.comments);
  return CREATOR_SHARE * (likes + 2 * comments) * VALUE_PER_ENGAGEMENT;
}

export default function ModeShell({
  children,
  videos = [],
}: {
  children: any;
  videos?: VideoMeta[];
}) {
  const [mode, setMode] = useState<'consumer' | 'creator'>('consumer');
  const safe = Array.isArray(videos) ? videos : [];

  const rows = useMemo(
    () =>
      safe.map((v) => ({
        ...v,
        likes: toNum(v.likes),
        comments: toNum(v.comments),
        revenue: computeProposedRevenue(v),
      })),
    [safe]
  );

  return (
    <view style={{ position: 'relative', minHeight: '100vh' }}>
      <view>{children}</view>

      {/* Toggle pill — align with back button */}
      <view
        bindtap={() => setMode(mode === 'consumer' ? 'creator' : 'consumer')}
        style={{
          position: 'fixed',
          top: '56px',         // same vertical as back button
          right: '20px',       // sits flush to the right
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
        <CreatorOverlay rows={rows} onClose={() => setMode('consumer')} />
      )}
    </view>
  );
}

function CreatorOverlay({
  rows,
  onClose,
}: {
  rows: Array<VideoMeta & { revenue: number }>;
  onClose: () => void;
}) {
  const totalLikes = rows.reduce((a, r) => a + toNum(r.likes), 0);
  const totalComments = rows.reduce((a, r) => a + toNum(r.comments), 0);
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);

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
          maxWidth: '420px',
          backgroundColor: '#fff',
          borderLeft: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '40px',
        }}
      >
        {/* Header - REMOVED CLOSE BUTTON */}
        <view
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#fff',
          }}
        >
          <text style={{ fontWeight: '600', fontSize: '16px', color: '#111' }}>
            Creator Dashboard
          </text>
        </view>

        {/* Totals */}
        <view
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
          }}
        >
          <Stat label="Likes" value={formatNumber(totalLikes)} />
          <Stat label="Comments" value={formatNumber(totalComments)} />
          <Stat label="Est. Revenue" value={formatCurrency(totalRevenue)} />
        </view>

        {/* Per-video list with headers */}
        <view style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
          <view style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '12px 0',
            borderBottom: '2px solid #333',
            fontWeight: '600',
            color: '#666'
          }}>
            <text style={{ flex: 1, color: '#666' }}>Video</text>
            <text style={{ width: '60px', textAlign: 'right', color: '#666' }}>Likes</text>
            <text style={{ width: '80px', textAlign: 'right', color: '#666' }}>Comments</text>
            <text style={{ width: '90px', textAlign: 'right', color: '#666' }}>Revenue</text>
          </view>
          
          {rows.map((r, index) => (
            <view
              key={r.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f2f2f2',
              }}
            >
              <text style={{ flex: 1, color: '#111', fontWeight: '500' }}>
                {r.title || `Video ${index + 1}`}
              </text>
              <text style={{ width: '60px', textAlign: 'right', color: '#333' }}>
                {formatNumber(r.likes)}
              </text>
              <text style={{ width: '80px', textAlign: 'right', color: '#333' }}>
                {formatNumber(r.comments)}
              </text>
              <text style={{ width: '90px', textAlign: 'right', fontWeight: '600', color: '#000' }}>
                {formatCurrency(r.revenue)}
              </text>
            </view>
          ))}
        </view>

        <view style={{ padding: '10px 16px', borderTop: '1px solid #eee' }}>
          <text style={{ fontSize: '12px', color: '#666' }}>
            Proposed = {Math.round(CREATOR_SHARE * 100)}% × (${VALUE_PER_ENGAGEMENT.toFixed(3)} per like + 2×comment)
          </text>
        </view>
      </view>
    </view>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <view
      style={{
        flex: 1,
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '8px 10px',
        backgroundColor: '#fafafa',
      }}
    >
      <text style={{ fontSize: '11px', color: '#777' }}>{label}</text>
      <text style={{ fontSize: '14px', fontWeight: '600', color: '#000' }}>
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

  // add thousands separators without Intl
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
