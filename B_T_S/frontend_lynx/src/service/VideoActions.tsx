import { useState, useCallback, useRef } from '@lynx-js/react';
import { videoService} from './VideoService.js';

interface Video {
  id: number;
  author: string;
  description: string;
  likes?: number | string;
  comments?: number | string;
  shares?: number;
  views?: number;
  saves?: number;
}

export function useVideoActions() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const watchStartTime = useRef<number>();
  const videoWatchTimes = useRef<number[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const videosData = await videoService.fetchVideos();
      setVideos(videosData);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackEngagement = useCallback(async (type: string, videoId: number, metadata = {}) => {
    const result = await videoService.trackEngagement(type, videoId, metadata);
    if (result) {
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, ...result } : v
      ));
    }
    return result;
  }, []);

  const trackWatchTime = useCallback((videoId: number) => {
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
  }, [trackEngagement]);

  const likeVideo = useCallback(async (videoId: number) => {
    return await trackEngagement('like', videoId);
  }, [trackEngagement]);

  const commentVideo = useCallback(async (videoId: number) => {
    return await trackEngagement('comment', videoId);
  }, [trackEngagement]);

  const shareVideo = useCallback(async (videoId: number) => {
    return await trackEngagement('share', videoId);
  }, [trackEngagement]);

  const saveVideo = useCallback(async (videoId: number) => {
    return await trackEngagement('save', videoId);
  }, [trackEngagement]);

  return {
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
  };
}
