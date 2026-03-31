import { describe, it, expect } from "vitest";
import { join } from "path";
import { discoverChapters } from "../../src/stages/discover.js";

const fixturesDir = join(import.meta.dirname, "../fixtures");

describe("discoverChapters", () => {
  it("discovers chapters from numbered files in directories", async () => {
    const result = await discoverChapters(
      join(fixturesDir, "numbered-book"),
      {}
    );
    expect(result.chapters).toHaveLength(4);
    expect(result.chapters[0].title).toBe("Preface");
    expect(result.chapters[1].title).toBe("Introduction");
    expect(result.chapters[1].part).toBe("part1");
    expect(result.chapters[3].title).toBe("Advanced Topics");
    expect(result.chapters[3].part).toBe("part2");
    expect(result.metadata.title).toBe("My Test Book");
  });

  it("discovers chapters from SUMMARY.md", async () => {
    const result = await discoverChapters(
      join(fixturesDir, "summary-book"),
      {}
    );
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].title).toBe("Introduction");
    expect(result.chapters[1].title).toBe("Chapter One");
  });

  it("uses config file chapter order over auto-detect", async () => {
    const result = await discoverChapters(
      join(fixturesDir, "config-book"),
      {}
    );
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].title).toBe("Second Chapter");
    expect(result.chapters[1].title).toBe("First Chapter");
    expect(result.metadata.title).toBe("Config Book");
    expect(result.metadata.author).toBe("Test Author");
  });
});
