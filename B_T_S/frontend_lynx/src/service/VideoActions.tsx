import { useState, useCallback, useRef } from '@lynx-js/react'
import { videoService, livestreamService } from './VideoService.js'

interface Video {
  id: number
  author: string
  description: string
  likes?: number | string
  comments?: number | string
  shares?: number
  views?: number
  saves?: number
}

export function useVideoActions() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const watchStartTime = useRef<number>()
  const videoWatchTimes = useRef<number[]>([])

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const videosData = await videoService.fetchVideos()
      setVideos(videosData)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const trackEngagement = useCallback(async (type: string, videoId: number, metadata = {}) => {
    const result = await videoService.trackEngagement(type, videoId, metadata)
    if (result) {
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...result } : v))
    }
    return result
  }, [])

  const trackWatchTime = useCallback((videoId: number) => {
    if (watchStartTime.current) {
      const watchDuration = (Date.now() - watchStartTime.current) / 1000
      const totalDuration = 30
      const completionRate = Math.min(watchDuration / totalDuration, 1)
      if (!videoWatchTimes.current[videoId]) videoWatchTimes.current[videoId] = 0
      videoWatchTimes.current[videoId] += watchDuration
      trackEngagement('watch_time', videoId, { duration: watchDuration, completionRate, totalWatchTime: videoWatchTimes.current[videoId] })
    }
  }, [trackEngagement])

  // Use trackEngagement so the UI updates immediately
  const likeVideo = useCallback(async (videoId: number) => trackEngagement('like', videoId), [trackEngagement])
  const commentVideo = useCallback(async (videoId: number) => trackEngagement('comment', videoId), [trackEngagement])
  const shareVideo = useCallback(async (videoId: number) => trackEngagement('share', videoId), [trackEngagement])
  const saveVideo = useCallback(async (videoId: number) => trackEngagement('save', videoId), [trackEngagement])

  return { videos, loading, currentVideoIndex, setCurrentVideoIndex, watchStartTime, videoWatchTimes, fetchVideos, trackEngagement, trackWatchTime, likeVideo, commentVideo, shareVideo, saveVideo }
}

export function useLivestreamActions() {
  const [streams, setStreams] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0)
  const watchStartTime = useRef<number>()
  const streamWatchTimes = useRef<number[]>([])

  const fetchStreams = useCallback(async () => {
    setLoading(true)
    try {
      const data = await livestreamService.fetchLivestreams()
      setStreams(data)
    } catch (error) {
      console.error('Failed to fetch livestreams:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const trackStreamEngagement = useCallback(async (type: string, streamId: number, metadata = {}) => {
    const result = await livestreamService.trackStreamEngagement(type, streamId, metadata)
    if (result) {
      setStreams(prev => prev.map(s => s.id === streamId ? { ...s, ...result } : s))
    }
    return result
  }, [])

  const trackWatchTime = useCallback((streamId: number) => {
    if (watchStartTime.current) {
      const watchDuration = (Date.now() - watchStartTime.current) / 1000
      const totalDuration = 60
      const completionRate = Math.min(watchDuration / totalDuration, 1)
      if (!streamWatchTimes.current[streamId]) streamWatchTimes.current[streamId] = 0
      streamWatchTimes.current[streamId] += watchDuration
      trackStreamEngagement('watch_time', streamId, { duration: watchDuration, completionRate, totalWatchTime: streamWatchTimes.current[streamId] })
    }
  }, [trackStreamEngagement])

  // Use trackStreamEngagement so counts update on tap
  const likeStream = useCallback(async (streamId: number) => trackStreamEngagement('like', streamId), [trackStreamEngagement])
  const commentStream = useCallback(async (streamId: number) => trackStreamEngagement('comment', streamId), [trackStreamEngagement])
  const shareStream = useCallback(async (streamId: number) => trackStreamEngagement('share', streamId), [trackStreamEngagement])
  const saveStream = useCallback(async (streamId: number) => trackStreamEngagement('save', streamId), [trackStreamEngagement])
  const donateToLivestream = useCallback(async (streamId: number, amount: number = 1) => {
const data = await livestreamService.donateToStream(streamId, amount)
// Merge server-calculated currentStats so revenue/metrics refresh in Creator view
if (data?.currentStats) {
setStreams(prev => prev.map(s => (s.id === streamId ? { ...s, ...data.currentStats } : s)))
}
return data
}, [])

  return { streams, loading, currentStreamIndex, setCurrentStreamIndex, watchStartTime, streamWatchTimes, fetchStreams, trackStreamEngagement, trackWatchTime, likeStream, commentStream, shareStream, saveStream, donateToLivestream }
}


