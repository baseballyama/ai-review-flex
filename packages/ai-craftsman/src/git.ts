/**
 * reference: https://gist.github.com/drwpow/86b11688babd6d1251b90e22ef7354ba
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

const getOctokit = () => {
  const githubToken = process.env["GITHUB_TOKEN"];
  return new Octokit({ auth: githubToken });
};

const getOwnerAndRepo = () => {
  const ownerAndRepo = (process.env["GITHUB_REPOSITORY"] ?? "").split("/");
  const owner = ownerAndRepo[0] ?? "";
  const repo = ownerAndRepo[1] ?? "";
  return { owner, repo };
};

const getPullNumberAndCommitId = () => {
  const githubEventPath = process.env["GITHUB_EVENT_PATH"] ?? "";
  const githubEvent = JSON.parse(readFileSync(githubEventPath, "utf8"));
  const pullNumber = githubEvent.pull_request.number ?? "";
  const commitId = githubEvent.pull_request.head.sha ?? "";
  return { pullNumber, commitId };
};

export const postComment = async (
  path: string,
  position: number,
  body: string
) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber, commitId } = getPullNumberAndCommitId();
    await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitId,
      path,
      position,
      body,
    });
  } catch (error) {
    console.error(error);
  }
};

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
    return { file, diff, path: diffFile };
  });
};
