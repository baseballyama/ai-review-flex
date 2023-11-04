import { chat } from "../utils/openai.js";

// ----------------------------------------------------------------------
// Request
// ----------------------------------------------------------------------

const buildPrompt = (codinfRule: string) => {
  return `\
あなたは世界最高峰のプログラマーです。あなたの仕事はGitHubのdiffを見てコードレビューをすることです。
以下のdiffに対して以下のコーディングガイドに従っているかをレビューしてください。
コーディングガイドに従っている場合は "OK" とだけコメントしてください。
コーディングガイドに従っていない場合は改善方法をコメントしてください。
diffの各行の先頭には行番号がついていることに注意してください。

---

コーディングガイドは以下です。

${codinfRule}

---

回答形式は以下です。

## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}

## 改善点
lines: {{指摘開始行}},{{指摘終了行}}
{{ここに改善点を書いてください}}
`;
};

// ----------------------------------------------------------------------
// Response
// ----------------------------------------------------------------------

export interface ReviewComment {
  start: number;
  end: number;
  body: string;
}

const appendCodingRule = (body: string, codingRule: string) => {
  const [name, ...rest] = codingRule.split("\n");
  const detail = `\
<details>
<summary>Reference: ${name?.replace(/^\s*#*?\s*/, "")}</summary>

${rest.join("\n")}
</details>`;

  return `${body}\n\n${detail}`;
};

const buildComment = (
  str: string,
  codingRule: string
): ReviewComment | undefined => {
  let start = 0;
  let end = 0;
  let encountLine = false;
  let body = "";
  for (const l of str.split("\n")) {
    if (l.startsWith("lines:")) {
      const [s, e] = l.split(/:\s*/)[1]?.split(/[,\-]/) ?? [];
      start = Number(s) || 0;
      end = Number(e) || 0;
      encountLine = true;
    } else if (encountLine) {
      if (body) body += "\n";
      body += l;
    }
  }
  if (start === 0 || end === 0 || body === "") return undefined;
  body = appendCodingRule(body, codingRule);
  return { start, end, body };
};

const parseResponse = (
  response: string,
  codingRule: string
): ReviewComment[] => {
  const comments: ReviewComment[] = [];
  let buf = "";
  const lines =
    response.match(/.*?((#+)?\s*改善点[\s\S]*)/m)?.[0].split("\n") ?? [];
  for (const line of lines) {
    if (line?.match(/^(#+)?\s*改善点/)) {
      const comment = buildComment(buf, codingRule);
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
    const comment = buildComment(buf, codingRule);
    if (comment != null) {
      comments.push(comment);
    }
  }

  return comments;
};

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------

export const review = async (
  codingRule: string,
  diff: string
): Promise<ReviewComment[]> => {
  const response = await chat([
    {
      content: buildPrompt(codingRule),
      role: "system",
    },
    {
      content: diff,
      role: "user",
    },
  ]);

  return parseResponse(response, codingRule);
};
