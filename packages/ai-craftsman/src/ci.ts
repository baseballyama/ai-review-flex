import { getDiff, postComment } from "./git.js";
import { splitForEachDIff } from "./diff.js";
import { chat } from "./openai.js";
import { promiseAllWithConcurrencyLimit } from "./concurrent.js";

const prompt = `\
あなたは世界最高峰のプログラマーです。あなたの仕事はGitHubのdiffを見てコードレビューをすることです。
以下のdiffをレビューして改善点を挙げてください。改善点が特にない場合は 'NO' と回答してください。
diffの各行の先頭には行番号がついていることに注意してください。
回答形式は以下です。

---
## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}

## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}
`;

const excludePatterns = [
  /.*node_modules/,
  /.*pnpm-lock.yaml$/,
  /.*yarn.lock$/,
  /.*package-lock.json$/,
];

const splitComments = (
  response: string
): { start: number; end: number; comment: string }[] => {
  const build = (str: string) => {
    let start = 0;
    let end = 0;
    let encountLine = false;
    let comment = "";
    for (const l of str.split("\n")) {
      if (l.startsWith("lines:")) {
        const [s, e] = l.split(/:\s*/)[1]?.split(/[,\-]/) ?? [];
        start = Number(s) || 0;
        end = Number(e) || 0;
        encountLine = true;
      } else if (encountLine) {
        if (comment) comment += "\n";
        comment += l;
      }
    }
    if (start === 0 || end === 0 || comment === "") return undefined;
    return { start, end, comment };
  };

  const comments: { start: number; end: number; comment: string }[] = [];
  let buf = "";
  const lines =
    response.match(/.*?(##\s*改善点[\s\S]*)/m)?.[0].split("\n") ?? [];
  for (const line of lines) {
    if (line?.match(/^##\s*改善点/)) {
      const comment = build(buf);
      if (comment != null) {
        comments.push(comment);
      }
      buf = "";
    } else {
      if (buf !== "") buf += "\n";
      buf += line;
    }
  }

  return comments;
};

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
    console.log(diff);
    const chunked = splitForEachDIff(diff);
    for (const source of chunked) {
      promises.push(async () => {
        const response = await chat([
          {
            content: prompt,
            role: "system",
          },
          {
            content: source.diff,
            role: "user",
          },
        ]);

        console.log({ response });
        for (const comment of splitComments(response)) {
          console.log({ comment });
          postComment(path, comment.start, comment.end, comment.comment);
        }
      });
    }
  }

  await promiseAllWithConcurrencyLimit(promises, 10);
};

void main();
