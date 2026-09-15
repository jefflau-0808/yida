import { NextResponse } from "next/server";

export function apiError(
  status: number,
  code: string,
  message: string,
  requestId = crypto.randomUUID(),
  retryable = false,
) {
  return NextResponse.json(
    { code, message, requestId, retryable },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function privateJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "private, no-store",
      ...init?.headers,
    },
  });
}
