import { describe, it, expect } from "vitest";
import { parseChapter } from "../../src/stages/parse.js";
import type { Chapter } from "../../src/types.js";

describe("parseChapter", () => {
  it("converts markdown to HTML", async () => {
    const chapter: Chapter = {
      title: "Test",
      filePath: "/repo/ch1.md",
      content: "# Hello\n\nThis is a **test**.",
      order: 0,
    };
    const result = await parseChapter(chapter);
    expect(result.htmlContent).toContain("<h1>Hello</h1>");
    expect(result.htmlContent).toContain("<strong>test</strong>");
  });

  it("extracts image references", async () => {
    const chapter: Chapter = {
      title: "Images",
      filePath: "/repo/part1/ch2.md",
      content: "![diagram](../diagrams/arch.svg)\n\n![photo](images/pic.png)",
      order: 1,
      part: "part1",
    };
    const result = await parseChapter(chapter);
    expect(result.images).toHaveLength(2);
    expect(result.images[0].isSvg).toBe(true);
    expect(result.images[1].isSvg).toBe(false);
  });

  it("detects remote images", async () => {
    const chapter: Chapter = {
      title: "Remote",
      filePath: "/repo/ch3.md",
      content: "![remote](https://example.com/img.png)",
      order: 2,
    };
    const result = await parseChapter(chapter);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].isRemote).toBe(true);
  });

  it("syntax-highlights code blocks", async () => {
    const chapter: Chapter = {
      title: "Code",
      filePath: "/repo/ch4.md",
      content: "```javascript\nconst x = 1;\n```",
      order: 3,
    };
    const result = await parseChapter(chapter);
    expect(result.htmlContent).toContain("hljs");
  });
});
