import { readFile, readdir } from "fs/promises";
import { join, relative, dirname, basename, extname } from "path";
import { existsSync } from "fs";
import { loadConfigFile } from "../config.js";
import { detectLanguage } from "../utils/language.js";
import type {
  BookConfig,
  Chapter,
  BookMetadata,
  DiscoveryResult,
} from "../types.js";

const EXCLUDED_FILES = new Set([
  "readme.md",
  "contributing.md",
  "changelog.md",
  "license.md",
  "code_of_conduct.md",
  "summary.md",
]);

export async function discoverChapters(
  repoDir: string,
  cliConfig: Partial<BookConfig>
): Promise<DiscoveryResult> {
  const fileConfig = await loadConfigFile(repoDir);
  const config = { ...fileConfig, ...stripUndefined(cliConfig) };

  let chapters: Chapter[];

  if (config.chapters && config.chapters.length > 0) {
    chapters = await chaptersFromConfig(repoDir, config.chapters);
  } else if (existsSync(join(repoDir, "SUMMARY.md"))) {
    chapters = await chaptersFromSummary(repoDir);
  } else {
    chapters = await chaptersFromFilesystem(repoDir);
  }

  const metadata = await resolveMetadata(repoDir, config, chapters);

  return { chapters, metadata };
}

async function chaptersFromConfig(
  repoDir: string,
  paths: readonly string[]
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  for (let i = 0; i < paths.length; i++) {
    const filePath = join(repoDir, paths[i]);
    const content = await readFile(filePath, "utf-8");
    const title = extractTitle(content) ?? basename(paths[i], ".md");
    const part = extractPart(paths[i]);
    chapters.push({ title, filePath, content, order: i, part });
  }
  return chapters;
}

async function chaptersFromSummary(repoDir: string): Promise<Chapter[]> {
  const summaryPath = join(repoDir, "SUMMARY.md");
  const summaryContent = await readFile(summaryPath, "utf-8");
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const chapters: Chapter[] = [];
  let match: RegExpExecArray | null;
  let order = 0;

  while ((match = linkPattern.exec(summaryContent)) !== null) {
    const [, , href] = match;
    const filePath = join(repoDir, href.replace(/^\.\//, ""));
    if (!filePath.endsWith(".md")) continue;
    try {
      const content = await readFile(filePath, "utf-8");
      const title = extractTitle(content) ?? basename(filePath, ".md");
      chapters.push({ title, filePath, content, order, part: undefined });
      order++;
    } catch {
      // Skip missing files referenced in SUMMARY.md
    }
  }
  return chapters;
}

async function chaptersFromFilesystem(repoDir: string): Promise<Chapter[]> {
  const mdFiles = await findMarkdownFiles(repoDir, repoDir);
  const sorted = mdFiles.sort((a, b) => {
    const aDir = dirname(relative(repoDir, a));
    const bDir = dirname(relative(repoDir, b));
    if (aDir !== bDir) {
      if (aDir === ".") return -1;
      if (bDir === ".") return 1;
      return aDir.localeCompare(bDir, undefined, { numeric: true });
    }
    return basename(a).localeCompare(basename(b), undefined, { numeric: true });
  });

  const chapters: Chapter[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const content = await readFile(sorted[i], "utf-8");
    const title = extractTitle(content) ?? basename(sorted[i], ".md");
    const part = extractPart(relative(repoDir, sorted[i]));
    chapters.push({ title, filePath: sorted[i], content, order: i, part });
  }
  return chapters;
}

async function findMarkdownFiles(
  dir: string,
  repoRoot: string
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      files.push(...(await findMarkdownFiles(fullPath, repoRoot)));
    } else if (
      entry.isFile() &&
      extname(entry.name).toLowerCase() === ".md" &&
      !EXCLUDED_FILES.has(entry.name.toLowerCase())
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function extractPart(relativePath: string): string | undefined {
  const dir = dirname(relativePath);
  if (dir === ".") return undefined;
  return dir.split("/")[0];
}

async function resolveMetadata(
  repoDir: string,
  config: Partial<BookConfig>,
  chapters: readonly Chapter[]
): Promise<BookMetadata> {
  let title = config.title;
  if (!title) {
    const readmePath = join(repoDir, "README.md");
    if (existsSync(readmePath)) {
      const readmeContent = await readFile(readmePath, "utf-8");
      title = extractTitle(readmeContent);
    }
  }
  if (!title) {
    title = basename(repoDir);
  }

  const author = config.author ?? "Unknown";

  let language = config.language;
  if (!language && chapters.length > 0) {
    language = detectLanguage(chapters[0].content);
  }
  language = language ?? "en";

  let cover = config.cover;
  if (!cover) {
    for (const name of ["cover.png", "cover.jpg", "cover.jpeg"]) {
      if (existsSync(join(repoDir, name))) {
        cover = join(repoDir, name);
        break;
      }
    }
  }

  return { title, author, language, cover };
}

function stripUndefined<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
