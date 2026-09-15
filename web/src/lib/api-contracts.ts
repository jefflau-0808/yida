import { z } from "zod";

export const garmentFeaturesSchema = z.object({
  category: z.enum(["top", "bottom", "shoes"]),
  type: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(30),
  pattern: z.string().trim().min(1).max(30),
  fit: z.string().trim().min(1).max(30),
});

export const garmentCandidateSchema = garmentFeaturesSchema.extend({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
});

export const recommendRequestSchema = z.object({
  requestId: z.string().uuid(),
  top: garmentCandidateSchema,
  scene: z.enum(["daily", "work", "date"]),
  candidates: z.array(garmentCandidateSchema).max(24),
  previousKeys: z.array(z.string().max(400)).max(8).default([]),
});

export const recommendationItemSchema = garmentFeaturesSchema.extend({
  name: z.string().min(1).max(80),
  candidateId: z.string().max(80).optional(),
});

export const recommendResponseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  bottom: recommendationItemSchema,
  shoes: recommendationItemSchema,
  reason: z.string().min(1).max(400),
  tip: z.string().min(1).max(240),
  mock: z.boolean(),
  variant: z.number().int().min(0),
});

export const imageJobRequestSchema = z.object({
  outfitId: z.string().min(1).max(300),
  requestHash: z.string().min(8).max(200),
  idempotencyKey: z.string().uuid(),
});

export const imageJobResponseSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["queued", "running", "succeeded", "failed", "expired", "cancelled"]),
  expiresAt: z.number(),
  mock: z.boolean(),
  imageUrl: z.string().optional(),
  error: z.string().optional(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;
