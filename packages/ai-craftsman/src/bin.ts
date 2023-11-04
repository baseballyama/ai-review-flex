import * as fs from "node:fs";
import * as path from "node:path";
import { parseMarkdown, chunkMarkdownByLevel } from "./utils/markdown.js";
import { getDiff, postComment } from "./utils/git.js";
import { splitForEachDiff } from "./utils/diff.js";
import { promiseAllWithConcurrencyLimit } from "./utils/concurrent.js";
import { env } from "./config.js";
import { review } from "./usecase/review.js";

const excludePatterns = [
  /.*node_modules/,
  /.*pnpm-lock.yaml$/,
  /.*yarn.lock$/,
  /.*package-lock.json$/,
  /.*\.md$/,
];

const readCodingRules = async (): Promise<string[]> => {
  const { codingGuide } = env;
  if (codingGuide.reader != null) {
    const module = await import(path.resolve(codingGuide.reader));
    return module.default() as string[];
  }
  if (codingGuide.path != null && codingGuide.level != null) {
    const markdown = await fs.promises.readFile("GUIDE.md", "utf-8");
    const parsed = parseMarkdown(markdown);
    return chunkMarkdownByLevel(parsed, 2);
  }

  throw new Error(
    "Please set CODING_GUIDE_PATH and CODING_GUIDE_LEVEL, or CODING_GUIDE_READER."
  );
};

const main = async () => {
  const rules = await readCodingRules();
  const promises: (() => Promise<void>)[] = [];
  for (const { diff, path } of getDiff(env.github.baseRef)) {
    if (excludePatterns.some((pattern) => pattern.test(path))) {
      console.log(`SKIP REVIEW: ${path}`);
      continue;
    } else {
      console.log(`START REVIEW: ${path}`);
    }
    for (const df of splitForEachDiff(diff)) {
      if (df.type === "delete") continue;
      for (const rule of rules) {
        promises.push(async () => {
          const reviewComments = await review(rule, df.diff);
          for (const comment of reviewComments) {
            postComment(path, comment.start, comment.end, comment.body);
          }
        });
      }
    }
  }

  await promiseAllWithConcurrencyLimit(promises, 1);
};

void main();
