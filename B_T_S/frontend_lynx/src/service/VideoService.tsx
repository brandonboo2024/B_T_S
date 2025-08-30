const API_BASE_URL = 'http://192.168.1.124:3001';

export interface Video {
  id: number;
  author: string;
  description: string;
  likes?: number | string;
  comments?: number | string;
  shares?: number;
  views?: number;
  saves?: number;
}

// Pure API functions - no React dependencies
export const videoService = {
  fetchVideos: async (): Promise<Video[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/videos`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      return [];
    }
  },

  trackEngagement: async (type: string, videoId: number, metadata = {}): Promise<any> => {
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
      return data.success ? data.currentStats : null;
    } catch (error) {
      console.error('Failed to track engagement:', error);
      return null;
    }
  },

  likeVideo: (videoId: number) => videoService.trackEngagement('like', videoId),
  commentVideo: (videoId: number) => videoService.trackEngagement('comment', videoId),
  shareVideo: (videoId: number) => videoService.trackEngagement('share', videoId),
  saveVideo: (videoId: number) => videoService.trackEngagement('save', videoId),
};

// ✅ NEW: Livestream APIs
export interface Livestream extends Video { isLive?: boolean }

export const livestreamService = {
  fetchLivestreams: async (): Promise<Livestream[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/livestreams`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch livestreams:', error);
      return [];
    }
  },

  trackStreamEngagement: async (type: string, streamId: number, metadata = {}): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/livestreams/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          type,
          userId: 'demo_user',
          ...metadata
        })
      });
      const data = await response.json();
      return data.success ? data.currentStats : null;
    } catch (error) {
      console.error('Failed to track stream engagement:', error);
      return null;
    }
  },

  donateToStream: async (streamId: number, amount: number = 1): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/livestreams/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, userId: 'demo_user', amount })
      });
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      console.error('Failed to donate to stream:', error);
      return null;
    }
  },

  likeStream: (streamId: number) => livestreamService.trackStreamEngagement('like', streamId),
  commentStream: (streamId: number) => livestreamService.trackStreamEngagement('comment', streamId),
  shareStream: (streamId: number) => livestreamService.trackStreamEngagement('share', streamId),
  saveStream: (streamId: number) => livestreamService.trackStreamEngagement('save', streamId),
};

