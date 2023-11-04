/**
 * reference: https://gist.github.com/drwpow/86b11688babd6d1251b90e22ef7354ba
 */

import * as fs from "node:fs";
import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";
import { env } from "../config.js";

const getOctokit = () => {
  return new Octokit({ auth: env.github.token });
};

const getOwnerAndRepo = () => {
  const ownerAndRepo = env.github.repository?.split("/") ?? [];
  const owner = ownerAndRepo[0] ?? "";
  const repo = ownerAndRepo[1] ?? "";
  return { owner, repo };
};

const getPullNumberAndCommitId = async () => {
  const githubEventPath = env.github.eventPath ?? "";
  const githubEvent = JSON.parse(
    await fs.promises.readFile(githubEventPath, "utf8")
  );
  const pullNumber = githubEvent.pull_request.number ?? "";
  const commitId = githubEvent.pull_request.head.sha ?? "";
  return { pullNumber, commitId };
};

export const isPrDraft = async (): Promise<boolean> => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber } = await getPullNumberAndCommitId();
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data.draft === true || data.title.startsWith("[WIP]");
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getCommentsOrderByCreatedAtDesc = async () => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber } = await getPullNumberAndCommitId();
    const { data } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return data.sort((a, b) => {
      const aCreatedAt = new Date(a.created_at).getTime();
      const bCreatedAt = new Date(b.created_at).getTime();
      return bCreatedAt - aCreatedAt;
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const hasCommentByTheApp = async (): Promise<boolean> => {
  const comments = await await getCommentsOrderByCreatedAtDesc();
  return comments.some((c) => c.body.includes(`<!-- COMMIT_ID: `));
};

export const postComment = async (body: string) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber, commitId } = await getPullNumberAndCommitId();
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitId,
      body: body + "\n\n" + `<!-- COMMIT_ID: ${commitId} -->`,
    });
  } catch (error) {
    console.error(error);
  }
};

export const postReviewComment = async (
  path: string,
  startLine: number,
  endLine: number,
  body: string
) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber, commitId } = await getPullNumberAndCommitId();
    await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitId,
      path,
      start_line: startLine,
      line: endLine,
      side: "RIGHT",
      body: body + "\n\n" + `<!-- COMMIT_ID: ${commitId} -->`,
    });
  } catch (error) {
    console.error(error);
  }
};

export interface Diff {
  path: string;
  diff: string;
}

export const getDiff = (targetBranch: string): Diff[] => {
  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
    .toString()
    .trim();

  const branch =
    currentBranch === targetBranch
      ? `HEAD~1..HEAD`
      : `origin/${targetBranch}..${currentBranch}`;

  const filePaths = execSync(
    `git --no-pager diff --minimal --name-only ${branch}`
  )
    .toString()
    .split("\n")
    .map((ln) => ln.trim())
    .filter((ln) => !!ln);

  const diffs: Diff[] = [];
  for (const path of filePaths) {
    if (!fs.existsSync(path)) {
      continue;
    }
    const diff = execSync(`git --no-pager diff ${branch} ${path}`)
      .toString()
      .trim();
    diffs.push({ path, diff });
  }

  return diffs;
};
