import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const targets = [
  ["../public/demo/tee.jpg", "jpeg"],
  ["../public/demo/jeans.jpg", "jpeg"],
  ["../public/demo/blue-jeans.jpg", "jpeg"],
  ["../public/demo/sneakers.webp", "webp"],
];
const checkOnly = process.argv.includes("--check");

function assertMetadataFree(metadata, relativePath) {
  if (metadata.exif || metadata.xmp || metadata.iptc || metadata.icc) {
    throw new Error(`Metadata removal failed for ${relativePath}`);
  }
}

for (const [relativePath, format] of targets) {
  const source = fileURLToPath(new URL(relativePath, import.meta.url));
  const original = await readFile(source);
  if (checkOnly) {
    assertMetadataFree(await sharp(original).metadata(), relativePath);
    continue;
  }
  const pipeline = sharp(original).rotate();
  const sanitized = format === "webp"
    ? await pipeline.webp({ quality: 88 }).toBuffer()
    : await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  assertMetadataFree(await sharp(sanitized).metadata(), relativePath);
  await writeFile(source, sanitized);
}

console.log(checkOnly ? `Verified ${targets.length} metadata-free demo images.` : `Sanitized ${targets.length} demo images.`);
