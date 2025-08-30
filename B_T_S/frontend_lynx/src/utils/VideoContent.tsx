import type { Picture } from "../assets/furnitures/furnituresPictures.jsx";
import {useState } from '@lynx-js/react'
import "../index.css";
import ImageCard from "./ImageCard.jsx";
import { calculateEstimatedSize } from "./utils.jsx";

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

interface VideoContentProps {
  pictureData: Picture[];
  videos: Video[];
  currentVideoIndex: number;
  setCurrentVideoIndex: (index: number) => void;
  likeVideo: (videoId: number) => Promise<void>;
  commentVideo: (videoId: number) => Promise<void>;
  shareVideo: (videoId: number) => Promise<void>;
  saveVideo: (videoId: number) => Promise<void>;
}

export const VideoContent = (props: VideoContentProps) => {
  const { 
    pictureData, 
    videos, 
    currentVideoIndex, 
    setCurrentVideoIndex,
    likeVideo,
    commentVideo,
    shareVideo,
    saveVideo
  } = props;

  const handleLike = async (index: number) => {
    const videoId = videos[index]?.id;
    if (videoId) {
      await likeVideo(videoId);
    }
  };

  const handleComment = async (index: number) => {
    const videoId = videos[index]?.id;
    if (videoId) {
      await commentVideo(videoId);
    }
  };

  const handleShare = async (index: number) => {
    const videoId = videos[index]?.id;
    if (videoId) {
      await shareVideo(videoId);
    }
  };

  const handleSave = async (index: number) => {
    const videoId = videos[index]?.id;
    if (videoId) {
      await saveVideo(videoId);
    }
  };

  return (
    <view className="gallery-wrapper">
      <list
        className="list"
        list-type="waterfall"
        column-count={1}
        scroll-orientation="vertical"
        custom-list-name="list-container"
      >
        {pictureData.map((picture: Picture, index: number) => {
          const video = videos[index] || {};
          return (
            <list-item
              estimated-main-axis-size-px={calculateEstimatedSize(picture.width, picture.height)}
              item-key={"" + index}
              key={"" + index}
            >
              <view style={{ flex: 1, position: 'relative' }}>
                <ImageCard picture={picture} />
                
                {/* TikTok-style engagement buttons */}
                <view style={{
                  position: 'absolute',
                  right: '20px',
                  bottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  {/* Like button */}
                  <view
                    bindtap={() => handleLike(index)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '10px',
                      borderRadius: '30px',
                      textAlign: 'center',
                      minWidth: '45px'
                    }}
                  >
                    <text style={{ fontSize: '24px', color: 'white' }}>♥</text>
                    <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
                      {video.likes || 0}
                    </text>
                  </view>

                  {/* Comment button */}
                  <view
                    bindtap={() => handleComment(index)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '10px',
                      borderRadius: '30px',
                      textAlign: 'center',
                      minWidth: '45px'
                    }}
                  >
                    <text style={{ fontSize: '24px', color: 'white' }}>💬</text>
                    <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
                      {video.comments || 0}
                    </text>
                  </view>

                  {/* Share button */}
                  <view
                    bindtap={() => handleShare(index)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '10px',
                      borderRadius: '30px',
                      textAlign: 'center',
                      minWidth: '45px'
                    }}
                  >
                    <text style={{ fontSize: '24px', color: 'white' }}>↗</text>
                    <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
                      {video.shares || 0}
                    </text>
                  </view>

                  {/* Save button */}
                  <view
                    bindtap={() => handleSave(index)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '10px',
                      borderRadius: '30px',
                      textAlign: 'center',
                      minWidth: '45px'
                    }}
                  >
                    <text style={{ fontSize: '24px', color: 'white' }}>🔖</text>
                    <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
                      {video.saves || 0}
                    </text>
                  </view>
                </view>

                {/* Video info overlay */}
                <view style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  right: '80px', /* Make space for buttons */
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '10px',
                  borderRadius: '8px'
                }}>
                  <text style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    display: 'block',
                    marginBottom: '5px'
                  }}>
                    {video.author || `@user${index + 1}`}
                  </text>
                  <text style={{ 
                    fontSize: '14px', 
                    color: 'white',
                    display: 'block'
                  }}>
                    {video.description || `Awesome video #${index + 1}`}
                  </text>
                  <text style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255,255,255,0.8)',
                    display: 'block',
                    marginTop: '5px'
                  }}>
                    👁 {video.views || 0} views
                  </text>
                </view>
              </view>
            </list-item>
          );
        })}
      </list>
    </view>
  );
};

export default VideoContent;
