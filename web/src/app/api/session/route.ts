import { NextRequest } from "next/server";
import { privateJson } from "@/lib/server/responses";
import {
  createSessionToken,
  isTrustedMutation,
  readSessionId,
  setSessionCookie,
} from "@/lib/server/session";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) {
    return privateJson(
      { code: "UNTRUSTED_ORIGIN", message: "请求来源不受信任", retryable: false },
      { status: 403 },
    );
  }
  const current = readSessionId(request);
  const response = privateJson({ ok: true, created: !current });
  if (!current) setSessionCookie(response, createSessionToken());
  return response;
}
