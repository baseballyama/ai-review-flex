import { getDiff } from "./git.js";
import { chunk } from "./diff.js";
import { getTokenCount, chat } from "./openai.js";

const main = async () => {
  const baseref = process.env["BASE_REF"];
  if (baseref == null || baseref === "") {
    throw new Error("BASE_REF is not set");
  }

  for (const { diff } of getDiff(baseref)) {
    const chunked = chunk({
      source: diff,
      counter: getTokenCount,
      maxCount: 500,
      duplicateLines: 2,
    });
    for (const { source } of chunked) {
      await chat([
        {
          content: "次のコードをレビューしてください",
          role: "system",
        },
        {
          content: source,
          role: "user",
        },
      ]);
    }
  }
};

void main();
