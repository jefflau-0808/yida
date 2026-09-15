import { beforeEach, describe, expect, it, vi } from "vitest";
import { createImageJob, getImageJob, imageJobStatus, resetImageJobsForTests } from "@/lib/server/image-jobs";

describe("模拟整套图任务", () => {
  beforeEach(() => {
    resetImageJobsForTests();
    vi.useRealTimers();
  });

  it("同一会话和幂等键只创建一个任务", () => {
    const input = { sessionId: "session-a", outfitId: "outfit-a", requestHash: "request-hash-a", idempotencyKey: "idem-a" };
    expect(createImageJob(input).id).toBe(createImageJob(input).id);
  });

  it("同一幂等键绑定不同内容时拒绝", () => {
    const input = { sessionId: "session-a", outfitId: "outfit-a", requestHash: "request-hash-a", idempotencyKey: "idem-a" };
    createImageJob(input);
    expect(() => createImageJob({ ...input, requestHash: "request-hash-b" })).toThrow("IDEMPOTENCY_CONFLICT");
  });

  it("任务不能跨匿名会话读取", () => {
    const job = createImageJob({ sessionId: "session-a", outfitId: "outfit-a", requestHash: "request-hash-a", idempotencyKey: "idem-a" });
    expect(getImageJob(job.id, "session-b")).toBeUndefined();
    expect(getImageJob(job.id, "session-a")?.id).toBe(job.id);
  });

  it("状态按 queued、running、succeeded 演进", () => {
    vi.useFakeTimers();
    const job = createImageJob({ sessionId: "session-a", outfitId: "outfit-a", requestHash: "request-hash-a", idempotencyKey: "idem-a" });
    expect(imageJobStatus(job)).toBe("queued");
    vi.advanceTimersByTime(300);
    expect(imageJobStatus(job)).toBe("running");
    vi.advanceTimersByTime(700);
    expect(imageJobStatus(job)).toBe("succeeded");
    vi.useRealTimers();
  });
});
