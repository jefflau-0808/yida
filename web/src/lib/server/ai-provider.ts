import type { AiProvider } from "@/lib/ai/provider";
import { analyzeMockGarment, mockRecommend } from "@/lib/server/mock-ai";

const mockProvider: AiProvider = {
  mode: "mock",
  analyzeGarment: async () => analyzeMockGarment(),
  recommendOutfit: mockRecommend,
};

export function getAiProvider(): AiProvider | undefined {
  if (process.env.YIDA_AI_MODE === "real") return undefined;
  return mockProvider;
}
