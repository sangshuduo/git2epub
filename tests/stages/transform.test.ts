import { describe, it, expect } from "vitest";
import { replaceImagePaths } from "../../src/stages/transform.js";

describe("replaceImagePaths", () => {
  it("replaces local image src with epub-relative paths", () => {
    const html = '<img src="/repo/images/pic.png" alt="pic">';
    const imageMap = new Map([["/repo/images/pic.png", "images/pic.png"]]);
    const result = replaceImagePaths(html, imageMap);
    expect(result).toContain('src="images/pic.png"');
  });

  it("replaces SVG references with PNG when converted", () => {
    const html = '<img src="/repo/diagrams/arch.svg" alt="arch">';
    const imageMap = new Map([["/repo/diagrams/arch.svg", "images/arch.png"]]);
    const result = replaceImagePaths(html, imageMap);
    expect(result).toContain('src="images/arch.png"');
  });

  it("handles multiple images in one chapter", () => {
    const html = '<img src="/repo/a.png" alt="a"><img src="/repo/b.jpg" alt="b">';
    const imageMap = new Map([
      ["/repo/a.png", "images/a.png"],
      ["/repo/b.jpg", "images/b.jpg"],
    ]);
    const result = replaceImagePaths(html, imageMap);
    expect(result).toContain('src="images/a.png"');
    expect(result).toContain('src="images/b.jpg"');
  });
});
