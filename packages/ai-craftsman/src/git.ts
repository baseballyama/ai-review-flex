/**
 * reference: https://gist.github.com/drwpow/86b11688babd6d1251b90e22ef7354ba
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export const getDiff = (targetBranch: string) => {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();

  const branch =
    currentBranch === targetBranch
      ? `HEAD~1..HEAD`
      : `origin/${targetBranch}..${currentBranch}`;

  const diffFiles = execSync(
    `git --no-pager diff --minimal --name-only ${branch}`
  )
    .toString()
    .split("\n")
    .map((ln) => ln.trim())
    .filter((ln) => !!ln);

  return diffFiles.map((diffFile) => {
    const file = readFileSync(diffFile, "utf-8");
    const diff = execSync(`git --no-pager diff --minimal ${branch} ${diffFile}`)
      .toString()
      .trim();
    return { file, diff };
  });
};
