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
