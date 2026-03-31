import { describe, it, expect } from "vitest";
import { buildEpubOptions } from "../../src/stages/build.js";
import type {
  ParsedChapter,
  BookMetadata,
  ProcessedImage,
} from "../../src/types.js";

describe("buildEpubOptions", () => {
  it("creates valid epub options from chapters and metadata", () => {
    const metadata: BookMetadata = {
      title: "Test Book",
      author: "Author",
      language: "en",
    };
    const chapters: ParsedChapter[] = [
      {
        title: "Chapter 1",
        filePath: "/repo/ch1.md",
        htmlContent: "<h1>Chapter 1</h1><p>Content</p>",
        images: [],
        order: 0,
      },
      {
        title: "Chapter 2",
        filePath: "/repo/ch2.md",
        htmlContent: "<h1>Chapter 2</h1><p>More</p>",
        images: [],
        order: 1,
      },
    ];
    const images: ProcessedImage[] = [];

    const options = buildEpubOptions(metadata, chapters, images);
    expect(options.title).toBe("Test Book");
    expect(options.author).toBe("Author");
    expect(options.lang).toBe("en");
    expect(options.content).toHaveLength(2);
    expect(options.content[0].title).toBe("Chapter 1");
    expect(options.content[1].title).toBe("Chapter 2");
  });

  it("includes processed images in options", () => {
    const metadata: BookMetadata = {
      title: "Image Book",
      author: "Author",
      language: "en",
    };
    const chapters: ParsedChapter[] = [];
    const images: ProcessedImage[] = [
      {
        originalPath: "/repo/img.png",
        outputPath: "images/img.png",
        data: Buffer.from("fake-image"),
        mimeType: "image/png",
      },
    ];

    const options = buildEpubOptions(metadata, chapters, images);
    expect(options.images).toHaveLength(1);
    expect(options.images[0].path).toBe("images/img.png");
    expect(options.images[0].mediaType).toBe("image/png");
  });

  it("includes cover path when provided", () => {
    const metadata: BookMetadata = {
      title: "Cover Book",
      author: "Author",
      language: "en",
      cover: "/path/to/cover.jpg",
    };
    const chapters: ParsedChapter[] = [];
    const images: ProcessedImage[] = [];

    const options = buildEpubOptions(metadata, chapters, images);
    expect(options.cover).toBe("/path/to/cover.jpg");
  });

  it("has css with base and highlight styles", () => {
    const metadata: BookMetadata = {
      title: "CSS Book",
      author: "Author",
      language: "en",
    };

    const options = buildEpubOptions(metadata, [], []);
    expect(options.css).toContain("font-family");
    expect(options.css).toContain(".hljs");
  });
});
