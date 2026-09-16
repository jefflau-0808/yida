import { z } from "zod";
import {
  garmentFeaturesSchema,
  recommendationItemSchema,
  type RecommendRequest,
} from "@/lib/api-contracts";
import { AiProviderError, type AiProvider, type GarmentAnalysis } from "@/lib/ai/provider";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface OpenAiProviderOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetcher?: FetchLike;
}

interface OpenAiResponseBody {
  output_text?: unknown;
  output?: Array<{
    type?: unknown;
    content?: Array<{ type?: unknown; text?: unknown }>;
  }>;
}

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_TIMEOUT_MS = 30_000;

const garmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["category", "type", "color", "pattern", "fit"],
  properties: {
    category: { type: "string", enum: ["top", "bottom", "shoes"] },
    type: { type: "string", minLength: 1, maxLength: 40 },
    color: { type: "string", minLength: 1, maxLength: 30 },
    pattern: { type: "string", minLength: 1, maxLength: 30 },
    fit: { type: "string", minLength: 1, maxLength: 30 },
  },
} as const;

const recommendationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "bottom", "shoes", "reason", "tip"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 80 },
    bottom: recommendationItemJsonSchema("bottom"),
    shoes: recommendationItemJsonSchema("shoes"),
    reason: { type: "string", minLength: 1, maxLength: 400 },
    tip: { type: "string", minLength: 1, maxLength: 240 },
  },
} as const;

const providerRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  bottom: recommendationItemSchema.extend({ candidateId: z.string().max(80).nullable() }),
  shoes: recommendationItemSchema.extend({ candidateId: z.string().max(80).nullable() }),
  reason: z.string().min(1).max(400),
  tip: z.string().min(1).max(240),
});

function recommendationItemJsonSchema(category: "bottom" | "shoes") {
  return {
    type: "object",
    additionalProperties: false,
    required: ["category", "type", "color", "pattern", "fit", "name", "candidateId"],
    properties: {
      category: { type: "string", enum: [category] },
      type: { type: "string", minLength: 1, maxLength: 40 },
      color: { type: "string", minLength: 1, maxLength: 30 },
      pattern: { type: "string", minLength: 1, maxLength: 30 },
      fit: { type: "string", minLength: 1, maxLength: 30 },
      name: { type: "string", minLength: 1, maxLength: 80 },
      candidateId: { type: ["string", "null"], maxLength: 80 },
    },
  } as const;
}

function extractOutputText(body: OpenAiResponseBody): string {
  if (typeof body.output_text === "string" && body.output_text.trim()) return body.output_text;
  for (const item of body.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new AiProviderError("AI 返回内容不完整，请重试", "INVALID_PROVIDER_OUTPUT", 502, true);
}

function providerErrorFromResponse(status: number, body: unknown): AiProviderError {
  const error = body && typeof body === "object" && "error" in body
    ? (body as { error?: { code?: unknown } }).error
    : undefined;
  const upstreamCode = typeof error?.code === "string" ? error.code : undefined;

  if (status === 401 || status === 403) {
    return new AiProviderError("AI 服务密钥无效或无权限", "AI_AUTH_FAILED", 503, false);
  }
  if (status === 429 && upstreamCode === "insufficient_quota") {
    return new AiProviderError("AI 服务额度不足，请检查账户余额", "AI_QUOTA_EXHAUSTED", 503, false);
  }
  if (status === 429) {
    return new AiProviderError("AI 服务请求较多，请稍后重试", "AI_RATE_LIMITED", 429, true);
  }
  if (status >= 500) {
    return new AiProviderError("AI 服务暂时不可用，请稍后重试", "AI_UPSTREAM_UNAVAILABLE", 503, true);
  }
  return new AiProviderError("AI 无法处理本次请求，请换一张清晰照片重试", "AI_REQUEST_REJECTED", 422, false);
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${bytes}`;
}

export function createOpenAiProvider(options: OpenAiProviderOptions): AiProvider {
  const fetcher = options.fetcher ?? fetch;
  const model = options.model?.trim() || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function requestStructured<T>(body: Record<string, unknown>, schema: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok) throw providerErrorFromResponse(response.status, responseBody);
      try {
        return schema.parse(JSON.parse(extractOutputText(responseBody as OpenAiResponseBody)));
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw new AiProviderError("AI 返回格式不正确，请重试", "INVALID_PROVIDER_OUTPUT", 502, true);
      }
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AiProviderError("AI 请求超时，请稍后重试", "AI_TIMEOUT", 504, true);
      }
      throw new AiProviderError("无法连接 AI 服务，请检查网络后重试", "AI_CONNECTION_FAILED", 503, true);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    mode: "real",
    async analyzeGarment(image: File): Promise<GarmentAnalysis> {
      const result = await requestStructured(
        {
          model,
          store: false,
          reasoning: { effort: "none" },
          max_output_tokens: 300,
          instructions: "你是衣物识别助手。只识别画面中的主要单件衣物，不推断品牌、价格、性别或身材。所有字段使用简短中文；信息不明确时使用“不确定”。",
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: "识别这件衣物的类别、具体类型、主色、图案和版型。" },
              { type: "input_image", image_url: await fileToDataUrl(image), detail: "low" },
            ],
          }],
          text: {
            format: {
              type: "json_schema",
              name: "garment_analysis",
              strict: true,
              schema: garmentJsonSchema,
            },
          },
        },
        garmentFeaturesSchema,
      );
      return {
        ...result,
        mock: false,
        notice: "已使用真实 AI 识别，请在保存前确认并修正标签。",
      };
    },
    async recommendOutfit(request: RecommendRequest) {
      const result = await requestStructured(
        {
          model,
          store: false,
          reasoning: { effort: "none" },
          max_output_tokens: 700,
          instructions: "你是中文日常穿搭助手。生成一套克制、可执行的裤装与鞋款建议。只可从输入候选中引用 candidateId；没有足够匹配的候选时必须返回 null。不要声称用户拥有未列出的衣物。",
          input: [{
            role: "user",
            content: [{
              type: "input_text",
              text: JSON.stringify({
                task: "根据上衣和场景生成一套裤子与鞋子搭配，避免 previousKeys 所代表的重复组合。",
                top: request.top,
                scene: request.scene,
                wardrobeCandidates: request.candidates,
                previousKeys: request.previousKeys,
              }),
            }],
          }],
          text: {
            format: {
              type: "json_schema",
              name: "outfit_recommendation",
              strict: true,
              schema: recommendationJsonSchema,
            },
          },
        },
        providerRecommendationSchema,
      );
      return {
        id: crypto.randomUUID(),
        ...result,
        bottom: { ...result.bottom, candidateId: result.bottom.candidateId ?? undefined },
        shoes: { ...result.shoes, candidateId: result.shoes.candidateId ?? undefined },
        mock: false,
        variant: request.previousKeys.length,
      };
    },
  };
}
