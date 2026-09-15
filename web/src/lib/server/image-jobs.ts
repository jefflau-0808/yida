export interface MockImageJob {
  id: string;
  sessionId: string;
  outfitId: string;
  requestHash: string;
  idempotencyKey: string;
  createdAt: number;
  readyAt: number;
  expiresAt: number;
}

const globalJobs = globalThis as typeof globalThis & {
  __yidaImageJobs?: Map<string, MockImageJob>;
  __yidaIdempotency?: Map<string, string>;
};
const jobs = (globalJobs.__yidaImageJobs ??= new Map());
const idempotency = (globalJobs.__yidaIdempotency ??= new Map());

export function createImageJob(input: {
  sessionId: string;
  outfitId: string;
  requestHash: string;
  idempotencyKey: string;
}): MockImageJob {
  const idempotencyLookup = `${input.sessionId}:${input.idempotencyKey}`;
  const existingId = idempotency.get(idempotencyLookup);
  if (existingId) {
    const existing = jobs.get(existingId);
    if (!existing || existing.requestHash !== input.requestHash) {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    return existing;
  }
  const now = Date.now();
  const job: MockImageJob = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    readyAt: now + 900,
    expiresAt: now + 15 * 60_000,
  };
  jobs.set(job.id, job);
  idempotency.set(idempotencyLookup, job.id);
  return job;
}

export function getImageJob(id: string, sessionId: string): MockImageJob | undefined {
  const job = jobs.get(id);
  if (!job || job.sessionId !== sessionId) return undefined;
  return job;
}

export function imageJobStatus(job: MockImageJob) {
  const now = Date.now();
  if (now > job.expiresAt) return "expired" as const;
  if (now < job.readyAt) return now - job.createdAt > 250 ? ("running" as const) : ("queued" as const);
  return "succeeded" as const;
}

export function resetImageJobsForTests(): void {
  jobs.clear();
  idempotency.clear();
}
