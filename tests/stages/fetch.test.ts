import { describe, it, expect } from "vitest";
import { parseRepoUrl, isLocalPath } from "../../src/stages/fetch.js";

describe("parseRepoUrl", () => {
  it("parses a GitHub HTTPS URL", () => {
    const result = parseRepoUrl("https://github.com/user/repo");
    expect(result).toEqual({
      owner: "user",
      repo: "repo",
      host: "github.com",
      isGitHub: true,
    });
  });

  it("parses a GitHub URL with trailing slash", () => {
    const result = parseRepoUrl("https://github.com/user/repo/");
    expect(result).toEqual({
      owner: "user",
      repo: "repo",
      host: "github.com",
      isGitHub: true,
    });
  });

  it("parses a GitLab URL", () => {
    const result = parseRepoUrl("https://gitlab.com/user/repo");
    expect(result).toEqual({
      owner: "user",
      repo: "repo",
      host: "gitlab.com",
      isGitHub: false,
    });
  });

  it("throws on invalid URL", () => {
    expect(() => parseRepoUrl("not-a-url")).toThrow();
  });
});

describe("isLocalPath", () => {
  it("returns true for relative paths", () => {
    expect(isLocalPath("./my-book")).toBe(true);
  });

  it("returns true for absolute paths", () => {
    expect(isLocalPath("/home/user/book")).toBe(true);
  });

  it("returns false for URLs", () => {
    expect(isLocalPath("https://github.com/user/repo")).toBe(false);
  });
});
