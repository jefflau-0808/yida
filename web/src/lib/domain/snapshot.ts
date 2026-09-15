import type { OutfitRecommendation, OutfitSnapshot } from "./types";

export function createOutfitSnapshot(
  recommendation: OutfitRecommendation,
  generatedImageUrl?: string,
): OutfitSnapshot {
  const { imageUrl: _imageUrl, ...topRecord } = recommendation.top;
  return {
    ...recommendation,
    top: topRecord,
    topImageId: recommendation.top.imageId,
    generatedImageUrl,
    createdAt: Date.now(),
  };
}
