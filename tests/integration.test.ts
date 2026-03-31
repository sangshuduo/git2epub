import { describe, it, expect, afterEach } from "vitest";
import { runPipeline } from "../src/pipeline.js";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const fixturesDir = join(import.meta.dirname, "fixtures");

describe("integration: full pipeline", () => {
  const outputPath = join(fixturesDir, "test-output.epub");

  afterEach(() => {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });

  it("converts a local numbered-book fixture to EPUB", async () => {
    await runPipeline(join(fixturesDir, "numbered-book"), {
      output: outputPath,
      format: "epub",
      keepSvg: false,
      verbose: false,
    });
    expect(existsSync(outputPath)).toBe(true);
  });

  it("converts a local config-book fixture to EPUB", async () => {
    await runPipeline(join(fixturesDir, "config-book"), {
      output: outputPath,
      format: "epub",
      keepSvg: false,
      verbose: false,
    });
    expect(existsSync(outputPath)).toBe(true);
  });

  it("converts a local summary-book fixture to EPUB", async () => {
    await runPipeline(join(fixturesDir, "summary-book"), {
      output: outputPath,
      format: "epub",
      keepSvg: false,
      verbose: false,
    });
    expect(existsSync(outputPath)).toBe(true);
  });
});
