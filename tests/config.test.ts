import { describe, it, expect } from "vitest";
import { loadConfigFile, mergeConfig } from "../src/config.js";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("loadConfigFile", () => {
  const testDir = join(tmpdir(), "git2epub-test-config");

  it("returns empty config when no file exists", async () => {
    const result = await loadConfigFile("/nonexistent/path");
    expect(result).toEqual({});
  });

  it("parses a valid git2epub.yaml", async () => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      join(testDir, "git2epub.yaml"),
      `title: "Test Book"\nauthor: "Test Author"\nlanguage: en\nchapters:\n  - ch1.md\n  - ch2.md\n`
    );
    const result = await loadConfigFile(testDir);
    expect(result).toEqual({
      title: "Test Book",
      author: "Test Author",
      language: "en",
      chapters: ["ch1.md", "ch2.md"],
    });
    rmSync(testDir, { recursive: true, force: true });
  });
});

describe("mergeConfig", () => {
  it("CLI options override config file values", () => {
    const fileConfig = { title: "From File", author: "File Author" };
    const cliOptions = {
      title: "From CLI",
      format: "epub" as const,
      keepSvg: false,
      verbose: false,
    };
    const result = mergeConfig(fileConfig, cliOptions);
    expect(result.title).toBe("From CLI");
    expect(result.author).toBe("File Author");
  });
});
