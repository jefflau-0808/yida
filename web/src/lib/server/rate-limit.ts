type Counter = { count: number; resetsAt: number };
const globalCounters = globalThis as typeof globalThis & {
  __yidaRateCounters?: Map<string, Counter>;
};
const counters = (globalCounters.__yidaRateCounters ??= new Map());

export function allowRequest(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = counters.get(key);
  if (!current || current.resetsAt <= now) {
    counters.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function resetRateLimitsForTests(): void {
  counters.clear();
}
