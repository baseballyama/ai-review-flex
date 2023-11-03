import { getDiff } from "./git.js";
import { chunk } from "./diff.js";
import { getTokenCount, chat } from "./openai.js";
import { promiseAllWithConcurrencyLimit } from "./concurrent.js";

const main = async () => {
  const baseref = process.env["BASE_REF"];
  if (baseref == null || baseref === "") {
    throw new Error("BASE_REF is not set");
  }

  const promises: (() => Promise<void>)[] = [];
  for (const { diff } of getDiff(baseref)) {
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

  await promiseAllWithConcurrencyLimit(promises, 5);
};

void main();
