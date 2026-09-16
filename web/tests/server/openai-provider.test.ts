import { describe, expect, it, vi } from "vitest";
import { File as NodeFile } from "node:buffer";
import { AiProviderError } from "@/lib/ai/provider";
import { createOpenAiProvider } from "@/lib/server/openai-provider";
import type { RecommendRequest } from "@/lib/api-contracts";

function responseWithOutput(value: unknown) {
  return new Response(JSON.stringify({
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(value) }],
    }],
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const recommendationRequest: RecommendRequest = {
  requestId: "00000000-0000-4000-8000-000000000001",
  top: {
    id: "top-1",
    name: "白色宽松 T 恤",
    category: "top",
    type: "T 恤",
    color: "白色",
    pattern: "纯色",
    fit: "宽松",
  },
  scene: "daily",
  candidates: [{
    id: "bottom-1",
    name: "深蓝直筒牛仔裤",
    category: "bottom",
    type: "牛仔裤",
    color: "深蓝色",
    pattern: "纯色",
    fit: "直筒",
  }],
  previousKeys: [],
};

describe("OpenAI 真实适配器", () => {
  it("以 store=false 发送图片并解析结构化衣物标签", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => responseWithOutput({
      category: "top",
      type: "T 恤",
      color: "白色",
      pattern: "纯色",
      fit: "宽松",
    }));
    const provider = createOpenAiProvider({ apiKey: "test-key", fetcher });
    const image = new NodeFile([new Uint8Array([0xff, 0xd8, 0xff])], "top.jpg", { type: "image/jpeg" }) as unknown as File;

    await expect(provider.analyzeGarment(image)).resolves.toMatchObject({
      category: "top",
      type: "T 恤",
      mock: false,
    });
    const [, init] = fetcher.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.store).toBe(false);
    expect(body.model).toBe("gpt-5.6-luna");
    expect(body.input[0].content[1].image_url).toMatch(/^data:image\/jpeg;base64,/);
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
  });

  it("生成真实结构化推荐并把 null 候选转换为未匹配", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => responseWithOutput({
      title: "清爽有层次",
      bottom: {
        category: "bottom",
        type: "牛仔裤",
        color: "深蓝色",
        pattern: "纯色",
        fit: "直筒",
        name: "深蓝直筒牛仔裤",
        candidateId: "bottom-1",
      },
      shoes: {
        category: "shoes",
        type: "运动鞋",
        color: "米白色",
        pattern: "纯色",
        fit: "低帮",
        name: "米白低帮运动鞋",
        candidateId: null,
      },
      reason: "深浅配色形成清楚层次。",
      tip: "裤脚保持利落。",
    }));
    const provider = createOpenAiProvider({ apiKey: "test-key", fetcher });

    await expect(provider.recommendOutfit(recommendationRequest)).resolves.toMatchObject({
      mock: false,
      bottom: { candidateId: "bottom-1" },
      shoes: { candidateId: undefined },
    });
    const [, init] = fetcher.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.store).toBe(false);
    expect(body.text.format.type).toBe("json_schema");
    expect(body.input[0].content[0].text).toContain("bottom-1");
  });

  it("把额度不足转换成不可自动重试的明确错误", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      error: { code: "insufficient_quota" },
    }), { status: 429, headers: { "Content-Type": "application/json" } }));
    const provider = createOpenAiProvider({ apiKey: "test-key", fetcher });
    const image = new NodeFile([new Uint8Array([0xff, 0xd8, 0xff])], "top.jpg", { type: "image/jpeg" }) as unknown as File;

    const error = await provider.analyzeGarment(image).catch((caught) => caught);
    expect(error).toBeInstanceOf(AiProviderError);
    expect(error).toMatchObject({ code: "AI_QUOTA_EXHAUSTED", status: 503, retryable: false });
  });
});
