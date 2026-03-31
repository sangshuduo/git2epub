import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { extract } from "tar";

export interface RepoInfo {
  readonly owner: string;
  readonly repo: string;
  readonly host: string;
  readonly isGitHub: boolean;
}

export async function downloadTarball(
  info: RepoInfo,
  branch: string,
  destDir: string,
  token?: string
): Promise<string> {
  const url = `https://api.github.com/repos/${info.owner}/${info.repo}/tarball/${branch}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git2epub",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  await mkdir(destDir, { recursive: true });

  const body = response.body;
  if (!body) {
    throw new Error("Empty response body from GitHub API");
  }

  await pipeline(body, createGunzip(), extract({ cwd: destDir, strip: 1 }));

  return destDir;
}
