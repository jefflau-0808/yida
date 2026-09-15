import type { GarmentView } from "./types";

const now = Date.now();

export const SAMPLE_TOP: GarmentView = {
  id: "sample-top",
  imageId: "sample-top-image",
  imageHash: "sample-top-hash",
  name: "白色圆领 T 恤",
  category: "top",
  type: "T 恤",
  color: "白色",
  pattern: "纯色",
  fit: "宽松",
  origin: "sample",
  revision: 1,
  createdAt: now,
  updatedAt: now,
  imageUrl: "/demo/tee.jpg",
};

export const SAMPLE_BOTTOMS = [
  {
    id: "sample-jeans",
    imageId: "sample-jeans-image",
    imageHash: "sample-jeans-hash",
    name: "深蓝直筒牛仔裤",
    category: "bottom",
    type: "牛仔裤",
    color: "深蓝色",
    pattern: "纯色",
    fit: "直筒",
    origin: "sample",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    imageUrl: "/demo/jeans.jpg",
  },
  {
    id: "sample-tapered-jeans",
    imageId: "sample-tapered-image",
    imageHash: "sample-tapered-hash",
    name: "蓝色锥形牛仔裤",
    category: "bottom",
    type: "牛仔裤",
    color: "蓝色",
    pattern: "纯色",
    fit: "锥形",
    origin: "sample",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    imageUrl: "/demo/blue-jeans.jpg",
  },
] satisfies GarmentView[];

export const SAMPLE_SHOES: GarmentView = {
  id: "sample-shoes",
  imageId: "sample-shoes-image",
  imageHash: "sample-shoes-hash",
  name: "米白低帮运动鞋",
  category: "shoes",
  type: "运动鞋",
  color: "米白色",
  pattern: "拼色",
  fit: "低帮",
  origin: "sample",
  revision: 1,
  createdAt: now,
  updatedAt: now,
  imageUrl: "/demo/sneakers.webp",
};

export const SAMPLE_GARMENTS: GarmentView[] = [
  SAMPLE_TOP,
  SAMPLE_BOTTOMS[0],
  SAMPLE_SHOES,
];
