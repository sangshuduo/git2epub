#!/usr/bin/env node

import { Command } from "commander";
import { runPipeline } from "./pipeline.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8")
    );
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("git2epub")
  .description("Convert GitHub-hosted markdown books to EPUB/PDF")
  .version(getVersion())
  .argument("<repo-url-or-path>", "GitHub/GitLab URL or local directory path")
  .option("-o, --output <file>", "Output filename")
  .option("-f, --format <type>", "Output format: epub | pdf", "epub")
  .option("--title <title>", "Override book title")
  .option("--author <author>", "Override author name")
  .option("--lang <code>", "Override language code")
  .option("--cover <path>", "Cover image path or URL")
  .option("--keep-svg", "Keep SVGs as-is instead of converting to PNG", false)
  .option("--branch <name>", "Git branch to use")
  .option("--token <token>", "GitHub/GitLab token for private repos")
  .option("--config <file>", "Path to config file")
  .option("-v, --verbose", "Verbose output", false)
  .action(async (source: string, opts) => {
    try {
      const format = opts.format as "epub" | "pdf";
      if (format !== "epub" && format !== "pdf") {
        console.error(
          `Error: Invalid format "${opts.format}". Use "epub" or "pdf".`
        );
        process.exit(1);
      }

      await runPipeline(source, {
        output: opts.output,
        format,
        title: opts.title,
        author: opts.author,
        lang: opts.lang,
        cover: opts.cover,
        keepSvg: opts.keepSvg,
        branch: opts.branch,
        token: opts.token,
        config: opts.config,
        verbose: opts.verbose,
      });
    } catch (err) {
      console.error(
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
      process.exit(1);
    }
  });

program.parse();
