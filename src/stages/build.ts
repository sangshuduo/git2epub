import { EPub } from "epub-gen-memory";
import { writeFile } from "fs/promises";
import type {
  ParsedChapter,
  BookMetadata,
  ProcessedImage,
} from "../types.js";

const HIGHLIGHT_CSS = `
.hljs{background:#f6f8fa;padding:1em;border-radius:6px;overflow-x:auto}
.hljs-keyword,.hljs-selector-tag{color:#d73a49}
.hljs-string,.hljs-attr{color:#032f62}
.hljs-comment{color:#6a737d}
.hljs-function .hljs-title{color:#6f42c1}
.hljs-number,.hljs-literal{color:#005cc5}
.hljs-built_in{color:#e36209}
`;

const BASE_CSS = `
body{font-family:serif;line-height:1.6;max-width:100%;padding:1em;color:#1a1a1a}
h1,h2,h3{font-family:sans-serif;margin-top:1.5em}
h1{font-size:1.8em;border-bottom:1px solid #eee;padding-bottom:0.3em}
h2{font-size:1.4em}
h3{font-size:1.2em}
pre{background:#f6f8fa;padding:1em;border-radius:6px;overflow-x:auto;font-size:0.9em}
code{font-family:monospace;font-size:0.9em}
p code{background:#f0f0f0;padding:0.2em 0.4em;border-radius:3px}
img{max-width:100%;height:auto}
blockquote{border-left:4px solid #ddd;margin-left:0;padding-left:1em;color:#555}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:0.5em;text-align:left}
th{background:#f6f8fa}
`;

export interface EpubOptions {
  readonly title: string;
  readonly author: string;
  readonly lang: string;
  readonly cover?: string;
  readonly css: string;
  readonly content: readonly {
    readonly title: string;
    readonly data: string;
  }[];
  readonly images: readonly {
    readonly path: string;
    readonly data: Buffer;
    readonly mediaType: string;
  }[];
}

export function buildEpubOptions(
  metadata: BookMetadata,
  chapters: readonly ParsedChapter[],
  images: readonly ProcessedImage[]
): EpubOptions {
  const content = chapters.map((ch) => ({
    title: ch.title,
    data: ch.htmlContent,
  }));

  const epubImages = images.map((img) => ({
    path: img.outputPath,
    data: img.data,
    mediaType: img.mimeType,
  }));

  return {
    title: metadata.title,
    author: metadata.author,
    lang: metadata.language,
    cover: metadata.cover,
    css: BASE_CSS + HIGHLIGHT_CSS,
    content,
    images: epubImages,
  };
}

export async function buildEpub(
  metadata: BookMetadata,
  chapters: readonly ParsedChapter[],
  images: readonly ProcessedImage[],
  outputPath: string
): Promise<void> {
  const options = buildEpubOptions(metadata, chapters, images);

  const epubContent = options.content.map((c) => ({
    title: c.title,
    content: c.data,
  }));

  const epubBuffer = await new EPub(
    {
      title: options.title,
      author: options.author,
      lang: options.lang,
      cover: options.cover,
      css: options.css,
    },
    epubContent
  ).genEpub();

  await writeFile(outputPath, epubBuffer);

  const sizeMB = epubBuffer.length / 1024 / 1024;
  if (sizeMB > 100) {
    console.warn(`Warning: EPUB size is ${sizeMB.toFixed(1)}MB (>100MB)`);
  }
}

export async function buildPdf(
  metadata: BookMetadata,
  chapters: readonly ParsedChapter[],
  outputPath: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    const moduleName = "puppeteer";
    puppeteer = await import(/* webpackIgnore: true */ moduleName);
  } catch {
    throw new Error(
      "PDF generation requires Puppeteer. Install it with: npm install puppeteer"
    );
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
<meta charset="utf-8">
<title>${metadata.title}</title>
<style>${BASE_CSS}${HIGHLIGHT_CSS}
@media print {
  .chapter { page-break-before: always; }
  .chapter:first-child { page-break-before: avoid; }
}
</style>
</head>
<body>
${chapters.map((ch) => `<div class="chapter">${ch.htmlContent}</div>`).join("\n")}
</body>
</html>`;

  const launch = puppeteer.launch ?? puppeteer.default?.launch;
  if (!launch) {
    throw new Error("Failed to load Puppeteer launch function");
  }

  const browser = await launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="font-size:10px;text-align:center;width:100%"><span class="pageNumber"></span></div>',
  });
  await browser.close();
}
