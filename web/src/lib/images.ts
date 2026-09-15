const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_EDGE = 1280;
export const TARGET_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File): void {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("请使用 JPG、PNG 或 WebP 图片");
  }
  if (file.size === 0) throw new Error("图片为空，请重新选择");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("原图不能超过 10 MB");
}

function loadBitmap(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片无法解码，请换一张"));
    };
    image.src = url;
  });
}

export async function normalizeImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number; hash: string }> {
  validateImageFile(file);
  const image = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  if (width * height > 16_000_000) throw new Error("图片像素过大，请缩小后再试");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法处理图片");
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    quality -= 0.1;
  } while (blob && blob.size > TARGET_BYTES && quality >= 0.46);

  if (!blob) throw new Error("图片压缩失败，请重新选择");
  if (blob.size > TARGET_BYTES) throw new Error("压缩后图片仍过大，请换一张");
  const hashBuffer = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return { blob, width, height, hash };
}
