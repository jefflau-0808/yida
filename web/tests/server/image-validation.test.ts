import { describe, expect, it } from "vitest";
import { File as NodeFile } from "node:buffer";
import { hasValidImageSignature } from "@/lib/server/image-validation";

describe("服务端图片签名校验", () => {
  it("接受内容和 MIME 一致的 JPEG", async () => {
    const file = new NodeFile([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])], "top.jpg", { type: "image/jpeg" }) as unknown as File;
    await expect(hasValidImageSignature(file)).resolves.toBe(true);
  });

  it("拒绝只伪造 MIME 的文本文件", async () => {
    const file = new NodeFile(["not an image"], "fake.jpg", { type: "image/jpeg" }) as unknown as File;
    await expect(hasValidImageSignature(file)).resolves.toBe(false);
  });
});
