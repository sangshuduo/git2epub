import { existsSync } from "fs";
import { mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { downloadTarball, type RepoInfo } from "../utils/github-api.js";
import { gitClone } from "../utils/git.js";

export function isLocalPath(source: string): boolean {
  return (
    source.startsWith("/") ||
    source.startsWith("./") ||
    source.startsWith("../") ||
    source.startsWith("~") ||
    (!source.includes("://") && existsSync(source))
  );
}

export function parseRepoUrl(url: string): RepoInfo {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid repository URL: ${url}`);
  }

  const parts = parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Cannot parse owner/repo from URL: ${url}`);
  }

  return {
    owner: parts[0],
    repo: parts[1],
    host: parsed.hostname,
    isGitHub: parsed.hostname === "github.com",
  };
}

export async function fetchRepo(
  source: string,
  branch?: string,
  token?: string,
  verbose = false
): Promise<string> {
  if (isLocalPath(source)) {
    if (verbose) console.log(`Using local directory: ${source}`);
    return source;
  }

  const repoInfo = parseRepoUrl(source);
  const tempDir = await mkdtemp(join(tmpdir(), "git2epub-"));

  if (repoInfo.isGitHub) {
    try {
      if (verbose) console.log(`Downloading tarball from GitHub API...`);
      return await downloadTarball(
        repoInfo,
        branch ?? "main",
        tempDir,
        token
      );
    } catch (err) {
      if (verbose)
        console.log(`GitHub API failed, falling back to git clone...`);
    }
  }

  if (verbose) console.log(`Cloning repository...`);
  return await gitClone(source, tempDir, branch);
}
