import { NextRequest } from "next/server";
import { imageJobRequestSchema } from "@/lib/api-contracts";
import { createImageJob, imageJobStatus } from "@/lib/server/image-jobs";
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
  const quota = allowRequest(`image:${sessionId}`, 8, 60_000);
  if (!quota.allowed) {
    return apiError(429, "IMAGE_RATE_LIMITED", "示意图生成太频繁，请稍后再试", requestId, true);
  }
  const parsed = imageJobRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "INVALID_IMAGE_JOB", "示意图任务信息不完整", requestId);
  }
  if (process.env.YIDA_AI_MODE === "real") {
    return apiError(
      503,
      "REAL_PROVIDER_NOT_CONFIGURED",
      "真实绘图服务尚未配置",
      requestId,
    );
  }
  try {
    const job = createImageJob({ sessionId, ...parsed.data });
    return privateJson(
      {
        jobId: job.id,
        status: imageJobStatus(job),
        expiresAt: job.expiresAt,
        mock: true,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "IDEMPOTENCY_CONFLICT") {
      return apiError(409, "IDEMPOTENCY_CONFLICT", "重复请求内容不一致", requestId);
    }
    return apiError(500, "IMAGE_JOB_FAILED", "无法创建示意图任务", requestId, true);
  }
}
