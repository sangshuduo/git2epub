import type { ParsedChapter, ProcessedImage, ImageRef } from "../types.js";
import { processImage } from "../utils/images.js";

export function replaceImagePaths(html: string, imageMap: ReadonlyMap<string, string>): string {
  let result = html;
  for (const [originalPath, newPath] of imageMap) {
    result = result.replaceAll(`src="${originalPath}"`, `src="${newPath}"`);
  }
  return result;
}

export async function transformChapters(
  chapters: readonly ParsedChapter[],
  keepSvg: boolean
): Promise<{
  readonly transformedChapters: readonly ParsedChapter[];
  readonly images: readonly ProcessedImage[];
}> {
  const allImageRefs: ImageRef[] = [];
  for (const chapter of chapters) {
    allImageRefs.push(...chapter.images);
  }

  const uniqueImages = deduplicateImages(allImageRefs);
  const processedImages: ProcessedImage[] = [];
  const imageMap = new Map<string, string>();

  for (const imageRef of uniqueImages) {
    const processed = await processImage(imageRef, keepSvg);
    if (processed) {
      processedImages.push(processed);
      imageMap.set(imageRef.originalPath, processed.outputPath);
    }
  }

  const transformedChapters = chapters.map((chapter) => ({
    ...chapter,
    htmlContent: replaceImagePaths(chapter.htmlContent, imageMap),
  }));

  return { transformedChapters, images: processedImages };
}

function deduplicateImages(images: readonly ImageRef[]): ImageRef[] {
  const seen = new Set<string>();
  const unique: ImageRef[] = [];
  for (const img of images) {
    if (!seen.has(img.resolvedPath)) {
      seen.add(img.resolvedPath);
      unique.push(img);
    }
  }
  return unique;
}
