import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { dirname, resolve, extname } from "path";
import { visit } from "unist-util-visit";
import type { Chapter, ParsedChapter, ImageRef } from "../types.js";

export async function parseChapter(chapter: Chapter): Promise<ParsedChapter> {
  const images: ImageRef[] = [];
  const chapterDir = dirname(chapter.filePath);

  const processor = unified()
    .use(remarkParse)
    .use(() => (tree) => {
      visit(tree, "image", (node: { url: string }) => {
        const isRemote = node.url.startsWith("http://") || node.url.startsWith("https://");
        const resolvedPath = isRemote ? node.url : resolve(chapterDir, node.url);
        const isSvg = extname(node.url).toLowerCase() === ".svg";

        images.push({
          originalPath: node.url,
          resolvedPath,
          isRemote,
          isSvg,
        });
      });
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(chapter.content);

  return {
    title: chapter.title,
    filePath: chapter.filePath,
    htmlContent: String(result),
    images,
    order: chapter.order,
    part: chapter.part,
  };
}

export async function parseAllChapters(chapters: readonly Chapter[]): Promise<ParsedChapter[]> {
  const results: ParsedChapter[] = [];
  for (const chapter of chapters) {
    try {
      results.push(await parseChapter(chapter));
    } catch (err) {
      console.warn(
        `Warning: Failed to parse ${chapter.filePath}: ${err instanceof Error ? err.message : err}`
      );
    }
  }
  return results;
}
