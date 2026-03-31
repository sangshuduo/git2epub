import sharp from "sharp";
import { readFile } from "fs/promises";
import { extname, basename } from "path";
import type { ImageRef, ProcessedImage } from "../types.js";

const SIZE_WARN_BYTES = 5 * 1024 * 1024;

export async function processImage(
  imageRef: ImageRef,
  keepSvg: boolean
): Promise<ProcessedImage | null> {
  try {
    let data: Buffer;
    let mimeType: string;
    let outputName: string;

    if (imageRef.isRemote) {
      const response = await fetch(imageRef.resolvedPath);
      if (!response.ok) {
        console.warn(`Warning: Failed to download image: ${imageRef.resolvedPath}`);
        return null;
      }
      data = Buffer.from(await response.arrayBuffer());
    } else {
      data = await readFile(imageRef.resolvedPath);
    }

    if (data.length > SIZE_WARN_BYTES) {
      console.warn(
        `Warning: Image ${imageRef.originalPath} is ${(data.length / 1024 / 1024).toFixed(1)}MB`
      );
    }

    const ext = extname(imageRef.originalPath).toLowerCase();
    outputName = basename(imageRef.originalPath);

    if (ext === ".svg" && !keepSvg) {
      data = await sharp(data)
        .png({ quality: 90 })
        .resize(1600, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
        .toBuffer();
      outputName = outputName.replace(/\.svg$/i, ".png");
      mimeType = "image/png";
    } else if (ext === ".webp") {
      data = await sharp(data).png({ quality: 90 }).toBuffer();
      outputName = outputName.replace(/\.webp$/i, ".png");
      mimeType = "image/png";
    } else if (ext === ".svg") {
      mimeType = "image/svg+xml";
    } else if (ext === ".png") {
      mimeType = "image/png";
    } else if (ext === ".jpg" || ext === ".jpeg") {
      mimeType = "image/jpeg";
    } else if (ext === ".gif") {
      mimeType = "image/gif";
    } else {
      mimeType = "application/octet-stream";
    }

    return {
      originalPath: imageRef.resolvedPath,
      outputPath: `images/${outputName}`,
      data,
      mimeType,
    };
  } catch (err) {
    console.warn(
      `Warning: Failed to process image ${imageRef.originalPath}: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }
}
