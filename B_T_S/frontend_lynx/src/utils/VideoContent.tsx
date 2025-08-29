import type { Picture } from "../assets/furnitures/furnituresPictures.jsx";
import "../index.css";
import ImageCard from "./ImageCard.jsx";
import { calculateEstimatedSize } from "./utils.jsx";

export const VideoContent = (props: { pictureData: Picture[] }) => {
  const { pictureData } = props;

  return (
    <view className="gallery-wrapper">
      <list
        className="list"
        list-type="waterfall"
        column-count={1}
        scroll-orientation="vertical"
        custom-list-name="list-container"
      >
        {pictureData.map((picture: Picture, index: number) => (
          <list-item
            estimated-main-axis-size-px={calculateEstimatedSize(picture.width, picture.height)}
            item-key={"" + index}
            key={"" + index}
          >
            <ImageCard picture={picture} />
            <view style = {{right: '20px',
                            bottom: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            alignItems: 'center'}}>

             <view
               // bindtap={likeVideo}
               style={{
                 backgroundColor: 'rgba(255,255,255,0.2)',
                 padding: '12px',
                 borderRadius: '30px',
                 textAlign: 'center',
                 minWidth: '60px'
               }}
             >
               <text style={{ fontSize: '24px', color: 'white' }}>♥</text>
               <text style={{ fontSize: '12px', display: 'block', color: 'white' }}>
                 {/* {currentVideo.likes || 0} */}
                 ONE HUMONGOUS WHOPPER
               </text>
             </view>
            </view>

            <text> ONE BIG WHOPPER </text>
          </list-item>
        ))}
      </list>
    </view>
  );
};

export default VideoContent;



