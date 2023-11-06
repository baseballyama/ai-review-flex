import * as github from "@actions/github";
import * as fs from "node:fs";
import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

const githubToken = process.env["GITHUB_TOKEN"] ?? "";

const getOctokit = () => {
  return new Octokit({ auth: githubToken });
};

export const eventPath = process.env["GITHUB_EVENT_PATH"] ?? "";
export const repository = github.context.payload?.repository;
export const commentId = github.context?.payload?.comment?.["id"] ?? undefined;
export const comment = github.context?.payload?.comment?.["body"] || undefined;

const getOwnerAndRepo = () => {
  const { owner, name } = repository ?? {};
  return { owner: owner?.login ?? "", repo: name ?? "" };
};

const getPullNumber = () => {
  let number = github.context.payload.pull_request?.number;
  if (number) return number;
  number = github.context.issue?.number;
  if (number) return number;
  throw new Error("Cannot get pull request number.");
};

export const getCommitId = async (): Promise<string> => {
  const octokit = getOctokit();
  const { owner, repo } = getOwnerAndRepo();
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: getPullNumber(),
  });
  return data.head.sha;
};

export const isPrDraft = async (): Promise<boolean> => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: getPullNumber(),
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
    const { data: reviews } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: getPullNumber(),
    });
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: getPullNumber(),
    });

    return [...reviews, ...comments].sort((a, b) => {
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
  const comments = await getCommentsOrderByCreatedAtDesc();
  return comments.some((c) => c.body?.includes(`<!-- COMMIT_ID: `));
};

const appendCommitId = (body: string, commitId: string) => {
  return `${body}\n\n` + `<!-- COMMIT_ID: ${commitId} -->`;
};

export const getLatestCommitIdByTheApp = async (): Promise<string> => {
  const comments = await getCommentsOrderByCreatedAtDesc();
  const comment = comments.find((c) => c.body?.includes(`<!-- COMMIT_ID: `));
  return comment?.body?.match(/<!-- COMMIT_ID:\s*(.+?)\s*-->/)?.[1] ?? "";
};

export const reactToComment = async (
  commentId: number,
  content:
    | "+1"
    | "-1"
    | "laugh"
    | "confused"
    | "heart"
    | "hooray"
    | "rocket"
    | "eyes"
) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { data } = await octokit.rest.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: commentId,
      content: content,
    });
    return data;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const postComment = async (body: string) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: getPullNumber(),
      body: appendCommitId(body, await getCommitId()),
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
    const commitId = await getCommitId();
    await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: getPullNumber(),
      commit_id: commitId,
      path,
      start_line: startLine,
      line: endLine,
      side: "RIGHT",
      body: appendCommitId(body, commitId),
    });
  } catch (error) {
    console.error(error);
  }
};

export const getRef = async () => {
  const base = github.context.payload.pull_request?.["base"]?.sha;
  const head = github.context.payload.pull_request?.["head"]?.sha;
  if (base && head) return { base, head };
  const { owner, repo } = getOwnerAndRepo();
  const octokit = getOctokit();
  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: getPullNumber(),
  });
  return { base: pullRequest.base.sha, head: pullRequest.head.sha };
};

export interface Diff {
  path: string;
  diff: string;
}

export const getDiff = (base: string, head: string): Diff[] => {
  const command = `git --no-pager diff --minimal --name-only ${base}...${head}`;
  const filePaths = execSync(command)
    .toString()
    .split("\n")
    .map((ln) => ln.trim())
    .filter((ln) => !!ln);

  const diffs: Diff[] = [];
  for (const path of filePaths) {
    if (!fs.existsSync(path)) {
      continue;
    }
    const diff = execSync(`git --no-pager diff ${base}...${head} ${path}`)
      .toString()
      .trim();
    diffs.push({ path, diff });
  }

  return diffs;
};
