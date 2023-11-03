import { readFileSync } from "node:fs";
import { parseMarkdown, type MarkdownSectionNode } from "./markdown.js";
import { getDiff, postComment } from "./git.js";
import { splitForEachDIff } from "./diff.js";
import { chat } from "./openai.js";
import { promiseAllWithConcurrencyLimit } from "./concurrent.js";

const prompt = `\
あなたは世界最高峰のプログラマーです。あなたの仕事はGitHubのdiffを見てコードレビューをすることです。
以下のdiffに対して以下のコーディングガイドに従っているかをレビューしてください。
コーディングガイドに従っている場合は "OK" とコメントしてください。
コーディングガイドに従っていない場合は改善方法をコメントしてください。
diffの各行の先頭には行番号がついていることに注意してください。

---

コーディングガイドは以下です。

{{CODING_GUIDE}}

---

回答形式は以下です。

## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}

## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}
`;

const buildPrompt = (rule: string) => {
  return prompt.replace("{{CODING_GUIDE}}", rule);
};

const excludePatterns = [
  /.*node_modules/,
  /.*pnpm-lock.yaml$/,
  /.*yarn.lock$/,
  /.*package-lock.json$/,
  /.*\.md$/,
];

const readRules = () => {
  const getRule = (node: MarkdownSectionNode) => {
    let rule = `${node.title}\n\n${node.content}`;
    if (node.children.length > 0) {
      for (const child of node.children) {
        rule += getRule(child);
      }
    }
    return rule;
  };

  const markdown = readFileSync("GUIDE.md", "utf-8");
  const parsed = parseMarkdown(markdown);
  const rules: string[] = [];
  for (const level1 of parsed.children) {
    for (const level2 of level1.children) {
      const rule = getRule(level2);
      if (rule.match(/AI Review.*ON/g)) {
        rules.push(getRule(level2));
      }
    }
  }
  return rules;
};

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
    response.match(/.*?((#+)?\s*改善点[\s\S]*)/m)?.[0].split("\n") ?? [];
  for (const line of lines) {
    if (line?.match(/^(#+)?\s*改善点/)) {
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

  if (buf !== "") {
    const comment = build(buf);
    if (comment != null) {
      comments.push(comment);
    }
  }

  return comments;
};

const buildComment = (comment: string, rule: string) => {
  const [name, ...rest] = rule.split("\n");
  const detail = `\
<details>
<summary>Reference: ${name?.replace(/^\s*#+\s*/, "")}</summary>
${rest.join("\n")}
</details>`;

  return `${comment}\n\n${detail}`;
};

const main = async () => {
  const baseref = process.env["BASE_REF"];
  if (baseref == null || baseref === "") {
    throw new Error("BASE_REF is not set");
  }

  const rules = readRules();
  const promises: (() => Promise<void>)[] = [];
  for (const { diff, path } of getDiff(baseref)) {
    if (excludePatterns.some((pattern) => pattern.test(path))) {
      console.log(`SKIP REVIEW: ${path}`);
      continue;
    } else {
      console.log(`RUN REVIEW: ${path}`);
    }
    const chunked = splitForEachDIff(diff);
    for (const source of chunked) {
      for (const rule of rules) {
        promises.push(async () => {
          const response = await chat([
            {
              content: buildPrompt(rule),
              role: "system",
            },
            {
              content: source.diff,
              role: "user",
            },
          ]);

          for (const comment of splitComments(response)) {
            postComment(
              path,
              comment.start,
              comment.end,
              `${buildComment(comment.comment, rule)}`
            );
          }
        });
      }
    }
  }

  await promiseAllWithConcurrencyLimit(promises, 1);
};

void main();
