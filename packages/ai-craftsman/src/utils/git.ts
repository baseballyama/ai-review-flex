import github from "@actions/github";
import * as fs from "node:fs";
import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

const githubToken = process.env["GITHUB_TOKEN"] ?? "";

const getOctokit = () => {
  return new Octokit({ auth: githubToken });
};

export const eventPath = process.env["GITHUB_EVENT_PATH"] ?? "";
export const repository = github.context.payload?.repository;
export const comment = github.context?.payload?.comment?.["body"] || undefined;

const getOwnerAndRepo = () => {
  const { owner, name } = repository ?? {};
  return { owner: owner?.login ?? "", repo: name ?? "" };
};

const getPullNumberAndCommitId = async () => {
  const githubEvent = JSON.parse(await fs.promises.readFile(eventPath, "utf8"));
  const pullNumber = github.context.payload.pull_request?.number ?? 0;
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
    const { data: reviews } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pullNumber,
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
  return comment?.body?.match(/<!-- COMMIT_ID:\s*(.+)\s*-->/)?.[1] ?? "";
};

export const postComment = async (body: string) => {
  try {
    const octokit = getOctokit();
    const { owner, repo } = getOwnerAndRepo();
    const { pullNumber, commitId } = await getPullNumberAndCommitId();
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: appendCommitId(body, commitId),
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
      body: appendCommitId(body, commitId),
    });
  } catch (error) {
    console.error(error);
  }
};

export const getBaseRef = async () => {
  const ref = github.context.payload.pull_request?.["base"]?.ref;
  if (ref) return ref;
  const { owner, repo } = getOwnerAndRepo();
  const pullNumber = github.context.payload.issue?.["pull_request"]?.number;
  const octokit = getOctokit();
  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return pullRequest.base.ref;
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
