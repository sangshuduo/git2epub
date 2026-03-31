import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function gitClone(url: string, destDir: string, branch?: string): Promise<string> {
  const args = ["clone", "--depth", "1"];
  if (branch) {
    args.push("--branch", branch);
  }
  args.push(url, destDir);

  await execFileAsync("git", args, { timeout: 120_000 });
  return destDir;
}
