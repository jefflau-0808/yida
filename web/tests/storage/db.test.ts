import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearAllData, deleteGarment, listGarments, resetDatabaseForTests, saveGarment } from "@/lib/storage/db";

describe("IndexedDB 本地衣柜", () => {
  beforeEach(() => resetDatabaseForTests());
  afterEach(async () => clearAllData());

  it("原子保存图片和衣物，并可刷新读取", async () => {
    const result = await saveGarment({
      id: "g1", imageId: "i1", imageHash: "hash-1", image: new Blob(["image"], { type: "image/jpeg" }),
      width: 800, height: 800, name: "白色 T 恤", category: "top", type: "T 恤", color: "白色", pattern: "纯色", fit: "宽松",
    });
    expect(result.added).toBe(true);
    expect(await listGarments()).toMatchObject([{ id: "g1", name: "白色 T 恤", imageUrl: expect.stringContaining("blob:test") }]);
  });

  it("同一标准化图片重试时复用已有条目", async () => {
    const input = {
      id: "g1", imageId: "i1", imageHash: "hash-1", image: new Blob(["image"], { type: "image/jpeg" }),
      width: 800, height: 800, name: "白色 T 恤", category: "top" as const, type: "T 恤", color: "白色", pattern: "纯色", fit: "宽松",
    };
    await saveGarment(input);
    const repeated = await saveGarment({ ...input, id: "g2", imageId: "i2" });
    expect(repeated).toMatchObject({ added: false, garment: { id: "g1" } });
    expect(await listGarments()).toHaveLength(1);
  });

  it("删除衣物时同时删除其本地图片", async () => {
    await saveGarment({
      id: "g1", imageId: "i1", imageHash: "hash-1", image: new Blob(["image"], { type: "image/jpeg" }),
      width: 800, height: 800, name: "白色 T 恤", category: "top", type: "T 恤", color: "白色", pattern: "纯色", fit: "宽松",
    });
    await deleteGarment("g1");
    expect(await listGarments()).toEqual([]);
  });
});
