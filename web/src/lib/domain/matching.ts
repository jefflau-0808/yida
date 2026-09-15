import type {
  GarmentFeatures,
  GarmentView,
  RecommendationItem,
  Scene,
} from "./types";

export function exactDuplicate(
  garments: GarmentView[],
  imageHash: string,
): GarmentView | undefined {
  return garments.find(
    (garment) => garment.origin === "user" && garment.imageHash === imageHash,
  );
}

export function similarGarment(
  garments: GarmentView[],
  features: GarmentFeatures,
  excludedId?: string,
): GarmentView | undefined {
  return garments.find(
    (garment) =>
      garment.id !== excludedId &&
      garment.origin === "user" &&
      garment.category === features.category &&
      garment.type === features.type &&
      garment.color === features.color &&
      garment.fit === features.fit,
  );
}

export function resolveRecommendationMatch(
  garments: GarmentView[],
  item: Omit<RecommendationItem, "match">,
): RecommendationItem {
  const candidates = garments.filter(
    (garment) => garment.origin === "user" && garment.category === item.category,
  );
  const owned = candidates.find(
    (garment) =>
      garment.type === item.type &&
      garment.color === item.color &&
      garment.fit === item.fit,
  );
  if (owned) return { ...item, candidateId: owned.id, match: "owned" };

  const similar = candidates.find(
    (garment) =>
      garment.type === item.type &&
      (garment.color === item.color || garment.fit === item.fit),
  );
  if (similar) return { ...item, candidateId: similar.id, match: "similar" };
  return { ...item, candidateId: undefined, match: "reference" };
}

export function outfitKey(
  topId: string,
  scene: Scene,
  bottom: Pick<RecommendationItem, "type" | "color" | "fit">,
  shoes: Pick<RecommendationItem, "type" | "color" | "fit">,
): string {
  return [topId, scene, bottom.type, bottom.color, bottom.fit, shoes.type, shoes.color, shoes.fit].join("|");
}

export function hasDifferentCombination(
  previousKey: string | undefined,
  nextKey: string,
): boolean {
  return !previousKey || previousKey !== nextKey;
}
