const MIME_SIGNATURES = {
  "image/jpeg": (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) => bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]),
  "image/webp": (bytes: Uint8Array) =>
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
} as const;

export type SupportedImageMime = keyof typeof MIME_SIGNATURES;

export async function hasValidImageSignature(file: File): Promise<boolean> {
  const validator = MIME_SIGNATURES[file.type as SupportedImageMime];
  if (!validator) return false;
  const bytes = new Uint8Array(await new Response(file.slice(0, 12)).arrayBuffer());
  return bytes.length >= 12 && validator(bytes);
}
