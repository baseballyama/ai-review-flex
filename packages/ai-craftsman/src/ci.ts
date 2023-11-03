import { getDiff } from "./git.js";
import { chunk } from "./diff.js";
import { getTokenCount, chat } from "./openai.js";
import { promiseAllWithConcurrencyLimit } from "./concurrent.js";

const excludePatterns = [
  /.*node_modules/,
  /.*pnpm-lock.yaml$/,
  /.*yarn.lock$/,
  /.*package-lock.json$/,
];

const main = async () => {
  const baseref = process.env["BASE_REF"];
  if (baseref == null || baseref === "") {
    throw new Error("BASE_REF is not set");
  }

  const promises: (() => Promise<void>)[] = [];
  for (const { diff, path } of getDiff(baseref)) {
    if (excludePatterns.some((pattern) => pattern.test(path))) {
      console.log(`SKIP REVIEW: ${path}`);
      continue;
    } else {
      console.log(`RUN REVIEW: ${path}`);
    }
    const chunked = chunk({
      source: diff,
      counter: getTokenCount,
      maxCount: 500,
      duplicateLines: 2,
    });
    for (const { source } of chunked) {
      promises.push(async () => {
        const response = await chat([
          {
            content:
              "あなたは世界最高峰のプログラマーです。あなたの仕事はGitHubのdiffを見てコードレビューをすることです。それでは、以下のdiffをレビューして改善点を挙げてください。改善点が特にない場合は 'NO' と回答してください。diffは途中で切れている場合があることに注意してください。",
            role: "system",
          },
          {
            content: source,
            role: "user",
          },
        ]);
        console.log({ source, response });
      });
    }
  }

  await promiseAllWithConcurrencyLimit(promises, 10);
};

void main();
