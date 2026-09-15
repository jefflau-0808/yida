export const GARMENT_CATEGORIES = ["top", "bottom", "shoes"] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const SCENES = ["daily", "work", "date"] as const;
export type Scene = (typeof SCENES)[number];

export type GarmentOrigin = "user" | "sample";

export interface GarmentFeatures {
  category: GarmentCategory;
  type: string;
  color: string;
  pattern: string;
  fit: string;
}

export interface GarmentRecord extends GarmentFeatures {
  id: string;
  imageId: string;
  imageHash: string;
  name: string;
  origin: GarmentOrigin;
  revision: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredImage {
  id: string;
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  origin: "upload" | "sample" | "generated";
  createdAt: number;
}

export interface GarmentView extends GarmentRecord {
  imageUrl: string;
}

export interface RecommendationItem extends GarmentFeatures {
  name: string;
  candidateId?: string;
  match: "owned" | "similar" | "reference";
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  scene: Scene;
  top: GarmentView;
  bottom: RecommendationItem;
  shoes: RecommendationItem;
  reason: string;
  tip: string;
  mock: boolean;
  variant: number;
}

export interface OutfitSnapshot
  extends Omit<OutfitRecommendation, "top"> {
  top: GarmentRecord;
  topImageId: string;
  generatedImageId?: string;
  generatedImageUrl?: string;
  createdAt: number;
}

export interface FavoriteRecord {
  id: string;
  outfitId: string;
  snapshot: OutfitSnapshot;
  createdAt: number;
}

export interface ImageJobRecord {
  jobId: string;
  requestVersion: number;
  outfitId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "expired" | "cancelled";
  expiresAt: number;
}

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  top: "上衣",
  bottom: "裤子",
  shoes: "鞋子",
};

export const SCENE_LABELS: Record<Scene, string> = {
  daily: "日常休闲",
  work: "轻松通勤",
  date: "周末约会",
};

export const FEATURE_OPTIONS = {
  top: {
    types: ["T 恤", "衬衫", "卫衣", "针织衫", "其他上衣"],
    fits: ["宽松", "常规", "修身", "不确定"],
  },
  bottom: {
    types: ["牛仔裤", "休闲裤", "西裤", "其他裤装"],
    fits: ["宽直筒", "直筒", "锥形", "修身", "不确定"],
  },
  shoes: {
    types: ["运动鞋", "皮鞋", "乐福鞋", "短靴", "其他鞋款"],
    fits: ["低帮", "高帮", "常规", "不确定"],
  },
  colors: ["白色", "米白色", "黑色", "灰色", "蓝色", "深蓝色", "棕色", "绿色", "红色", "其他"],
  patterns: ["纯色", "条纹", "格纹", "印花", "拼色", "不确定"],
} as const;
