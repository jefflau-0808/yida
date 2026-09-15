import { describe, expect, it } from "vitest";
import { exactDuplicate, hasDifferentCombination, outfitKey, resolveRecommendationMatch, similarGarment } from "@/lib/domain/matching";
import type { GarmentView } from "@/lib/domain/types";

function garment(patch: Partial<GarmentView>): GarmentView {
  return {
    id: "g1",
    imageId: "i1",
    imageHash: "hash-1",
    imageUrl: "blob:test",
    name: "深蓝直筒牛仔裤",
    category: "bottom",
    type: "牛仔裤",
    color: "深蓝色",
    pattern: "纯色",
    fit: "直筒",
    origin: "user",
    revision: 1,
    createdAt: 1,
    updatedAt: 1,
    ...patch,
  };
}

describe("衣柜重复与匹配规则", () => {
  it("只把用户实物的相同摘要视为精确重复", () => {
    const user = garment({});
    const sample = garment({ id: "sample", imageHash: "sample-hash", origin: "sample" });
    expect(exactDuplicate([sample, user], "hash-1")?.id).toBe("g1");
    expect(exactDuplicate([sample], "sample-hash")).toBeUndefined();
  });

  it("相同标签只作为相似候选，不自动合并", () => {
    const existing = garment({});
    expect(similarGarment([existing], existing)?.id).toBe(existing.id);
    expect(similarGarment([existing], existing, existing.id)).toBeUndefined();
  });

  it("按精确、相似、参考款三种状态解析推荐", () => {
    const exact = garment({});
    const similar = garment({ id: "g2", color: "蓝色" });
    const base = { name: "推荐牛仔裤", category: "bottom" as const, type: "牛仔裤", color: "深蓝色", pattern: "纯色", fit: "直筒" };
    expect(resolveRecommendationMatch([exact], base)).toMatchObject({ match: "owned", candidateId: "g1" });
    expect(resolveRecommendationMatch([similar], base)).toMatchObject({ match: "similar", candidateId: "g2" });
    expect(resolveRecommendationMatch([], base)).toMatchObject({ match: "reference", candidateId: undefined });
  });

  it("同一组合生成稳定键，并能检测换一套是否重复", () => {
    const bottom = { type: "牛仔裤", color: "深蓝色", fit: "直筒" };
    const shoes = { type: "运动鞋", color: "米白色", fit: "低帮" };
    const key = outfitKey("top-1", "daily", bottom, shoes);
    expect(outfitKey("top-1", "daily", bottom, shoes)).toBe(key);
    expect(hasDifferentCombination(key, key)).toBe(false);
    expect(hasDifferentCombination(undefined, key)).toBe(true);
  });
});
