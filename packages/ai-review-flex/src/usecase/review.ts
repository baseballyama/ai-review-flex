import { chat } from "../utils/openai.js";

// ----------------------------------------------------------------------
// Request
// ----------------------------------------------------------------------

const buildPrompt = (codingRule: string, language: string) => {
  return `\
You are the world's best programmer. Your task is to review code by looking at GitHub diffs.
Please review the following diffs to see if they follow the coding guide below.
If they follow the coding guide, just reply "OK".
If not, please comment how to improve it.
Note that each line of the diff is prefixed with a line number.

---

The coding guide is below.

${codingRule}

---

The response format is as follows.

## Review Comment
lines: {{Start line number for the comment}},{{End line for the comment}}
{{Please write the review comment here in ${language}}}

## Review Comment
lines: {{Start line number for the comment}},{{End line number for the comment}}
{{Please write the review comment here in ${language}}}`;
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
    response.match(/.*?((#+)?\s*Review Comment[\s\S]*)/m)?.[0].split("\n") ??
    [];
  for (const line of lines) {
    if (line?.match(/^(#+)?\s*Review Comment/)) {
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
  filePath: string,
  diff: string,
  language: string
): Promise<ReviewComment[]> => {
  const response = await chat([
    {
      content: buildPrompt(codingRule, language),
      role: "system",
    },
    {
      content: `File path: ${filePath}\n\n${diff}`,
      role: "user",
    },
  ]);

  return parseResponse(response, codingRule);
};
