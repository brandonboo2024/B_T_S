import pic0 from "./badvid.jpg";
import pic1 from "./susvid.jpg";
import pic10 from "./goodvid.jpeg";
import pic11 from "./badls.jpeg";
import pic12 from "./fraudstream.jpeg";
import pic13 from "./goodls.jpeg";
/* import pic14 from "./14.png";
import pic2 from "./2.png";
import pic3 from "./3.png";
import pic4 from "./4.png";
import pic5 from "./5.png";
import pic6 from "./6.png";
import pic7 from "./7.png";
import pic8 from "./8.png";
import pic9 from "./9.png"; */

export interface Picture {
  src: string;
  width: number;
  height: number;
}

export const furnituresPicturesSubArray: Picture[] = [
  {
    src: pic0,
    width: 512,
    height: 850,
  },
  {
    src: pic1,
    width: 511,
    height: 437,
  },
 /* {
    src: pic2,
    width: 1024,
    height: 1589,
  }, */
  /* {
    src: pic3,
    width: 510,
    height: 418,
  }, */
  /* {
    src: pic4,
    width: 509,
    height: 438,
  }, */
  /* {
    src: pic5,
    width: 1024,
    height: 1557,
  }, */
  /* {
    src: pic6,
    width: 509,
    height: 415,
  }, */
  /* {
    src: pic7,
    width: 509,
    height: 426,
  }, */
  /* {
    src: pic8,
    width: 1024,
    height: 1544,
  }, */
  /* {
    src: pic9,
    width: 510,
    height: 432,
  }, */
  {
    src: pic10,
    width: 500,
    height: 900,
  },
  {
    src: pic11,
    width: 1024,
    height: 1545,
  },
  {
    src: pic12,
    width: 512,
    height: 416,
  },
  {
    src: pic13,
    width: 1024,
    height: 1509,
  },
  /* {
    src: pic14,
    width: 512,
    height: 411,
  }, */
];

export const furnituresPictures: Picture[] = [
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
];
