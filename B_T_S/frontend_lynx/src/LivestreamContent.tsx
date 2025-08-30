// FILE: src/LivestreamContent.tsx
import { useEffect, useState } from '@lynx-js/react'

export default function LivestreamContent({
  streams,
  currentStreamIndex,
  setCurrentStreamIndex,
  likeStream,
  commentStream,
  shareStream,
  saveStream,
  donateToLivestream,
}: {
  streams: any[]
  currentStreamIndex: number
  setCurrentStreamIndex: (i: number) => void
  likeStream: (id: number) => Promise<any>
  commentStream: (id: number) => Promise<any>
  shareStream: (id: number) => Promise<any>
  saveStream: (id: number) => Promise<any>
  donateToLivestream: (id: number, amount?: number) => Promise<any>
}) {
  const stream = streams[currentStreamIndex]
  const [toast, setToast] = useState<string>('')

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2000)
      return () => clearTimeout(t)
    }
  }, [toast])

  if (!stream) return <view />

  const next = () => setCurrentStreamIndex((currentStreamIndex + 1) % streams.length)
  const prev = () => setCurrentStreamIndex((currentStreamIndex - 1 + streams.length) % streams.length)

  const onDonate = async () => {
    const resp = await donateToLivestream(stream.id, 1)
    if (resp?.donation) {
      setToast(`$1 sent • Creator $${resp.donation.creatorCut.toFixed(2)} • Platform $${resp.donation.platformCut.toFixed(2)}`)
    } else {
      setToast('Donation failed')
    }
  }

  return (
    <view className='TikTokContainer'>
      {/* Background placeholder for live */}
      <view className='VideoContainer'>
        <view className='VideoPlaceholder'>
          <text className='VideoTitle'>LIVE • {stream.description || 'Livestream'}</text>
        </view>
      </view>

      {/* Top-left live + author */}
      <view style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        <text style={{ backgroundColor: '#e21', color: '#fff', fontWeight: "700", padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>LIVE</text>
        <text className='Username'>{stream.author}</text>
      </view>

      {/* Donate button moved BELOW the Creator/Consumer switch (which sits top-right). */}
      {/* The switch height is ~40-44px, so offset to 60px creates clear separation. */}
      <view
        bindtap={onDonate}
        style={{ position: 'absolute', top: '100px', right: '20px', backgroundColor: '#ff0050', padding: '10px 12px', borderRadius: '999px', display: 'flex', alignItems: 'center', zIndex: 9 }}
      >
        <text style={{ color: '#fff', fontWeight: "700", fontSize: '12px' }}>Donate $1</text>
      </view>

      {/* Side actions */}
      <view className='SideActions'>
        <view className='ActionButton' bindtap={() => likeStream(stream.id)}>
          <text className='ActionIcon'>❤</text>
          <text className='ActionCount'>{stream.likes || 0}</text>
        </view>
        <view className='ActionButton' bindtap={() => commentStream(stream.id)}>
          <text className='ActionIcon'>💬</text>
          <text className='ActionCount'>{stream.comments || 0}</text>
        </view>
        <view className='ActionButton' bindtap={() => shareStream(stream.id)}>
          <text className='ActionIcon'>↗</text>
          <text className='ActionCount'>{stream.shares || 0}</text>
        </view>
        <view className='ActionButton' bindtap={() => saveStream(stream.id)}>
          <text className='ActionIcon'>🔖</text>
          <text className='ActionCount'>{stream.saves || 0}</text>
        </view>
      </view>

      {/* Bottom info */}
      <view className='BottomInfo'>
        <text className='Username'>{stream.author}</text>
        <text className='Description'>{stream.description}</text>
      </view>

      {/* Navigation */}
      <view className='VideoNavigation'>
        <view className='NavButton' bindtap={prev}><text>Prev</text></view>
        <view className='NavButton' bindtap={next}><text>Next</text></view>
      </view>

      {/* Toast */}
      {toast && (
        <view style={{ position: 'absolute', top: '56px', right: '12px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 8px', borderRadius: '8px' }}>
          <text>{toast}</text>
        </view>
      )}
    </view>
  )
}

