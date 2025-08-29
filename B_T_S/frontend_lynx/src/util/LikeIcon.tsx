import { useCallback ,useState } from "@lynx-js/react";
import redHeart from "./redHeart.png";
import whiteHeart from "./whiteHeart.png";
import "../../index.css";

export default function LikeIcon() {
  const [isLiked, setIsLiked] = useState(false);
  const onTap = useCallback(() => {
    setIsLiked (prev => !prev)
  }, [])

  return (
    <view className="like-icon" bindtap={onTap}>
      {isLiked && <view className="circle" />}
      {isLiked && <view className="circle circleAfter" />}
      <image src={isLiked ? redHeart : whiteHeart} className="heart-love" />
    </view>
  );
}
