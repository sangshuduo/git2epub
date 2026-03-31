import { readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import type { BookConfig, CliOptions } from "./types.js";

export async function loadConfigFile(
  repoDir: string,
  configPath?: string
): Promise<BookConfig> {
  const filePath = configPath ?? join(repoDir, "git2epub.yaml");
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = yaml.load(content);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return parsed as BookConfig;
  } catch {
    return {};
  }
}

export function mergeConfig(
  fileConfig: BookConfig,
  cliOptions: CliOptions
): BookConfig & { readonly format: "epub" | "pdf" } {
  return {
    title: cliOptions.title ?? fileConfig.title,
    author: cliOptions.author ?? fileConfig.author,
    language: cliOptions.lang ?? fileConfig.language,
    cover: cliOptions.cover ?? fileConfig.cover,
    chapters: fileConfig.chapters,
    format: cliOptions.format,
  };
}
