import { fetchRepo } from "./stages/fetch.js";
import { discoverChapters } from "./stages/discover.js";
import { parseAllChapters } from "./stages/parse.js";
import { transformChapters } from "./stages/transform.js";
import { buildEpub, buildPdf } from "./stages/build.js";
import { basename } from "path";
import type { CliOptions } from "./types.js";

export async function runPipeline(source: string, options: CliOptions): Promise<void> {
  const verbose = options.verbose;

  // Stage 1: Fetch
  if (verbose) console.log("Stage 1/5: Fetching repository...");
  const repoDir = await fetchRepo(source, options.branch, options.token, verbose);

  // Stage 2: Discover
  if (verbose) console.log("Stage 2/5: Discovering chapters...");
  const { chapters, metadata } = await discoverChapters(repoDir, {
    title: options.title,
    author: options.author,
    language: options.lang,
    cover: options.cover,
  });

  if (chapters.length === 0) {
    throw new Error("No chapters found in the repository.");
  }

  if (verbose) {
    console.log(`  Found ${chapters.length} chapters`);
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Author: ${metadata.author}`);
    console.log(`  Language: ${metadata.language}`);
  }

  // Stage 3: Parse
  if (verbose) console.log("Stage 3/5: Parsing markdown...");
  const parsedChapters = await parseAllChapters(chapters);

  if (parsedChapters.length === 0) {
    throw new Error("All chapters failed to parse.");
  }

  // Stage 4: Transform
  if (verbose) console.log("Stage 4/5: Transforming content...");
  const { transformedChapters, images } = await transformChapters(parsedChapters, options.keepSvg);

  if (verbose) {
    console.log(`  Processed ${images.length} images`);
  }

  // Stage 5: Build
  const defaultName = basename(source.replace(/\/$/, "")).replace(/\.git$/, "");
  const outputPath =
    options.output ?? `${defaultName}.${options.format === "pdf" ? "pdf" : "epub"}`;

  if (options.format === "pdf") {
    if (verbose) console.log("Stage 5/5: Generating PDF...");
    await buildPdf(metadata, transformedChapters, outputPath);
  } else {
    if (verbose) console.log("Stage 5/5: Generating EPUB...");
    await buildEpub(metadata, transformedChapters, images, outputPath);
  }

  console.log(`Done! Output: ${outputPath}`);
}
