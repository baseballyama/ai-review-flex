import * as fs from "node:fs";
import * as path from "node:path";
import { parseMarkdown, chunkMarkdownByLevel } from "./utils/markdown.js";
import * as git from "./utils/git.js";
import { splitForEachDiff } from "./utils/diff.js";
import { promiseAllWithConcurrencyLimit } from "./utils/concurrent.js";
import { env } from "./config.js";
import { review } from "./usecase/review.js";

const excludePatterns = [
  /.*node_modules\//,
  /.*pnpm-lock.yaml$/,
  /.*yarn.lock$/,
  /.*package-lock.json$/,
];

interface ConfigRule {
  rule: string;
  filePattern: RegExp;
}

const readCodingRules = async (): Promise<ConfigRule[]> => {
  const { codingGuide } = env;
  if (codingGuide.reader != null) {
    const module = await import(path.resolve(codingGuide.reader));
    return (await module.default()) as ConfigRule[];
  }
  if (codingGuide.path != null) {
    const markdown = await fs.promises.readFile(codingGuide.path, "utf-8");
    const parsed = parseMarkdown(markdown);
    const chunked = chunkMarkdownByLevel(parsed, codingGuide.level);
    return chunked
      .filter((chunk) => codingGuide.enablePattern.test(chunk))
      .map((chunk) => {
        const [, filePattern = "^$"] =
          chunk.match(codingGuide.filePattern) ?? [];
        return { rule: chunk, filePattern: RegExp(filePattern, "m") };
      });
  }

  throw new Error(
    "Please set CODING_GUIDE_PATH and CODING_GUIDE_LEVEL, or CODING_GUIDE_READER."
  );
};

const main = async () => {
  if (await git.isPrDraft()) {
    console.log("Skip AI review because this PR is draft.");
    return;
  }

  let isIncremental = false;
  if (git.comment) {
    if (!git.comment.startsWith("/ai-review-flex")) {
      console.log(
        "Skip AI review because the comment doesn't starts with /ai-review-flex."
      );
      return;
    }
    if (git.comment.includes("incremental")) {
      isIncremental = true;
    }
  } else {
    if (await git.hasCommentByTheApp()) {
      console.log("Skip AI review because this PR has comment by the app.");
      return;
    }
  }

  const rules = await readCodingRules();
  const promises: (() => Promise<void>)[] = [];
  let commented = false;
  const targetBranch = isIncremental
    ? await git.getLatestCommitIdByTheApp()
    : await git.getBaseRef();
  for (const { diff, path } of git.getDiff(targetBranch)) {
    if (excludePatterns.some((pattern) => pattern.test(path))) {
      console.log(`SKIP REVIEW: ${path}`);
      continue;
    }
    for (const df of splitForEachDiff(diff)) {
      if (df.type === "delete") continue;
      for (const rule of rules) {
        if (!rule.filePattern.test(path)) {
          console.log(`SKIP REVIEW: ${path} by ${rule.rule.split("\n")[0]}`);
          continue;
        }
        const randomId = Math.random().toString(32).substring(2);
        promises.push(async () => {
          if (env.debug) {
            console.debug(`START REVIEW (${randomId})`, {
              path,
              rule,
              diff: df.diff,
            });
          }
          const reviewComments = await review(
            rule.rule,
            path,
            df.diff,
            env.language
          );
          for (const comment of reviewComments) {
            if (env.debug) {
              console.debug(`Receive REVIEW (${randomId})`, comment);
            }
            git.postReviewComment(
              path,
              comment.start,
              comment.end,
              comment.body
            );
            commented = true;
          }
        });
      }
    }
  }

  await promiseAllWithConcurrencyLimit(promises, 1);

  if (!commented) {
    git.postComment("Great! No problem found by AI Review Flex.");
  }
};

void main();
