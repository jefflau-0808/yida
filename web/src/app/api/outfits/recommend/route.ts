import { NextRequest } from "next/server";
import {
  recommendRequestSchema,
  recommendResponseSchema,
} from "@/lib/api-contracts";
import { getAiProvider } from "@/lib/server/ai-provider";
import { allowRequest } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/responses";
import { isTrustedMutation, readSessionId } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  if (!isTrustedMutation(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "请求来源不受信任", requestId);
  }
  const sessionId = readSessionId(request);
  if (!sessionId) return apiError(401, "SESSION_REQUIRED", "请刷新页面后重试", requestId);
  const quota = allowRequest(`recommend:${sessionId}`, 20, 60_000);
  if (!quota.allowed) {
    return apiError(429, "RATE_LIMITED", "推荐请求太频繁，请稍后重试", requestId, true);
  }
  const parsed = recommendRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "INVALID_RECOMMENDATION_INPUT", "搭配信息不完整", requestId);
  }
  const provider = getAiProvider();
  if (!provider) {
    return apiError(
      503,
      "REAL_PROVIDER_NOT_CONFIGURED",
      "真实推荐服务尚未配置",
      requestId,
    );
  }
  const result = recommendResponseSchema.safeParse(await provider.recommendOutfit(parsed.data));
  if (!result.success) {
    return apiError(502, "INVALID_PROVIDER_OUTPUT", "推荐结果格式不正确", requestId, true);
  }
  const candidateIds = new Set(parsed.data.candidates.map((candidate) => candidate.id));
  if (
    (result.data.bottom.candidateId && !candidateIds.has(result.data.bottom.candidateId)) ||
    (result.data.shoes.candidateId && !candidateIds.has(result.data.shoes.candidateId))
  ) {
    return apiError(502, "UNKNOWN_CANDIDATE", "推荐引用了无效的衣柜单品", requestId);
  }
  return privateJson({ ...result.data, requestId });
}
