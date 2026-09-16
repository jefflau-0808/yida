import type { RecommendRequest } from "@/lib/api-contracts";
import type { GarmentFeatures } from "@/lib/domain/types";

export interface GarmentAnalysis extends GarmentFeatures {
  mock: boolean;
  notice: string;
}

export interface AiProvider {
  readonly mode: "mock" | "real";
  analyzeGarment(image: File): Promise<GarmentAnalysis>;
  recommendOutfit(request: RecommendRequest): Promise<unknown>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
