import {
  imageJobResponseSchema,
  recommendResponseSchema,
  type RecommendRequest,
} from "@/lib/api-contracts";
import type { GarmentFeatures } from "@/lib/domain/types";

interface ApiFailure {
  code?: string;
  message?: string;
  retryable?: boolean;
}

async function parseFailure(response: Response): Promise<never> {
  const failure = (await response.json().catch(() => ({}))) as ApiFailure;
  throw new Error(failure.message ?? "请求失败，请稍后重试");
}

export async function ensureSession(): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) await parseFailure(response);
}

export async function analyzeGarment(image: Blob): Promise<
  GarmentFeatures & { mock: boolean; notice: string }
> {
  const form = new FormData();
  form.set("image", new File([image], "garment.jpg", { type: image.type }));
  const response = await fetch("/api/garments/analyze", {
    method: "POST",
    body: form,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) await parseFailure(response);
  return response.json();
}

export async function requestRecommendation(input: RecommendRequest) {
  const response = await fetch("/api/outfits/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) await parseFailure(response);
  return recommendResponseSchema.parse(await response.json());
}

export async function createImageJob(input: {
  outfitId: string;
  requestHash: string;
  idempotencyKey: string;
}) {
  const response = await fetch("/api/outfits/image-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) await parseFailure(response);
  return imageJobResponseSchema.parse(await response.json());
}

export async function getImageJob(jobId: string) {
  const response = await fetch(`/api/outfits/image-jobs/${encodeURIComponent(jobId)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) await parseFailure(response);
  return imageJobResponseSchema.parse(await response.json());
}
