import { NextRequest } from "next/server";
import { getAiProvider } from "@/lib/server/ai-provider";
import { allowRequest } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/responses";
import { isTrustedMutation, readSessionId } from "@/lib/server/session";
import { hasValidImageSignature } from "@/lib/server/image-validation";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  if (!isTrustedMutation(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "请求来源不受信任", requestId);
  }
  const sessionId = readSessionId(request);
  if (!sessionId) return apiError(401, "SESSION_REQUIRED", "请刷新页面后重试", requestId);
  const quota = allowRequest(`analyze:${sessionId}`, 10, 60_000);
  if (!quota.allowed) {
    return apiError(429, "RATE_LIMITED", "操作太频繁，请稍后重试", requestId, true);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError(400, "INVALID_FORM", "无法读取图片", requestId);
  }
  const image = form.get("image");
  if (!(image instanceof File)) {
    return apiError(400, "IMAGE_REQUIRED", "请选择一张衣物图片", requestId);
  }
  if (!ACCEPTED_TYPES.has(image.type) || image.size === 0 || image.size > 2 * 1024 * 1024) {
    return apiError(415, "INVALID_IMAGE", "请上传 2 MB 以内的 JPG、PNG 或 WebP", requestId);
  }
  if (!(await hasValidImageSignature(image))) {
    return apiError(415, "INVALID_IMAGE_CONTENT", "图片内容与格式不一致，请重新选择", requestId);
  }
  const provider = getAiProvider();
  if (!provider) {
    return apiError(
      503,
      "REAL_PROVIDER_NOT_CONFIGURED",
      "真实识别服务尚未配置，请切换模拟模式或完成供应商接入",
      requestId,
    );
  }
  const result = await provider.analyzeGarment(image);
  return privateJson({ ...result, requestId });
}
