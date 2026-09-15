import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "yida_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  const configured = process.env.YIDA_SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("YIDA_SESSION_SECRET is required in production");
  }
  return "yida-local-mock-session-secret";
}

function signature(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("base64url");
}

export function createSessionToken(): string {
  const id = crypto.randomUUID();
  return `${id}.${signature(id)}`;
}

export function readSessionId(request: NextRequest): string | undefined {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return undefined;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return undefined;
  const id = token.slice(0, separator);
  const provided = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(signature(id));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return undefined;
  }
  return id;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function isTrustedMutation(request: NextRequest): boolean {
  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost"].includes(request.nextUrl.hostname);
  if (isLocalDevelopment) return true;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === request.nextUrl.origin;
}
