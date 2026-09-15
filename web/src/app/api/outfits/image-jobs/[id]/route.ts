import { NextRequest } from "next/server";
import { getImageJob, imageJobStatus } from "@/lib/server/image-jobs";
import { apiError, privateJson } from "@/lib/server/responses";
import { readSessionId } from "@/lib/server/session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const sessionId = readSessionId(request);
  if (!sessionId) return apiError(401, "SESSION_REQUIRED", "请刷新页面后重试", requestId);
  const { id } = await context.params;
  const job = getImageJob(id, sessionId);
  if (!job) return apiError(404, "IMAGE_JOB_NOT_FOUND", "示意图任务不存在或已失效", requestId);
  const status = imageJobStatus(job);
  return privateJson({
    jobId: job.id,
    status,
    expiresAt: job.expiresAt,
    mock: true,
  });
}
