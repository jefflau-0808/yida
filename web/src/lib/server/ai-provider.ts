import type { AiProvider } from "@/lib/ai/provider";
import { analyzeMockGarment, mockRecommend } from "@/lib/server/mock-ai";
import { createOpenAiProvider } from "@/lib/server/openai-provider";

const mockProvider: AiProvider = {
  mode: "mock",
  analyzeGarment: async () => analyzeMockGarment(),
  recommendOutfit: mockRecommend,
};

export function getAiProvider(): AiProvider | undefined {
  if (process.env.YIDA_AI_MODE === "real") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return undefined;
    return createOpenAiProvider({
      apiKey,
      model: process.env.YIDA_OPENAI_TEXT_MODEL,
      timeoutMs: Number(process.env.YIDA_OPENAI_TIMEOUT_MS) || undefined,
    });
  }
  return mockProvider;
}
