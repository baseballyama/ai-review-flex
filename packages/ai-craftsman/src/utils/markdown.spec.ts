import { describe, test, expect } from "vitest";
import { parseMarkdown, chunkMarkdownByLevel } from "./markdown";

const markdown1 = `\
# タイトル1

これはタイトル1の内容です。

## サブタイトル1-1

これはサブタイトル1-1の内容です。

### サブサブタイトル1-1-1

これはサブサブタイトル1-1-1の内容です。

## サブタイトル1-2

これはサブタイトル1-2の内容です。

# タイトル2

これはタイトル2の内容です。

## サブタイトル2-1

これはサブタイトル2-1の内容です。`;

const markdown2 = `\
## タイトル1

これはタイトル1の内容です。

### サブタイトル1-1

これはサブタイトル1-1の内容です。

## サブタイトル1-2

これはサブタイトル1-2の内容です。

# トップレベルタイトル

これはトップレベルタイトルの内容です。`;

describe("markdown", () => {
  test("parseMarkdown", async () => {
    expect(parseMarkdown(markdown1)).toStrictEqual({
      type: "root",
      children: [
        {
          type: "node",
          title: "# タイトル1",
          content: "\n\nこれはタイトル1の内容です。\n",
          level: 1,
          children: [
            {
              type: "node",
              title: "## サブタイトル1-1",
              content: "\n\nこれはサブタイトル1-1の内容です。\n",
              level: 2,
              children: [
                {
                  type: "node",
                  title: "### サブサブタイトル1-1-1",
                  content: "\n\nこれはサブサブタイトル1-1-1の内容です。\n",
                  level: 3,
                  children: [],
                },
              ],
            },
            {
              type: "node",
              title: "## サブタイトル1-2",
              content: "\n\nこれはサブタイトル1-2の内容です。\n",
              level: 2,
              children: [],
            },
          ],
        },
        {
          type: "node",
          title: "# タイトル2",
          content: "\n\nこれはタイトル2の内容です。\n",
          level: 1,
          children: [
            {
              type: "node",
              title: "## サブタイトル2-1",
              content: "\n\nこれはサブタイトル2-1の内容です。",
              level: 2,
              children: [],
            },
          ],
        },
      ],
    });

    expect(parseMarkdown(markdown2)).toStrictEqual({
      type: "root",
      children: [
        {
          type: "node",
          title: "## タイトル1",
          content: "\n\nこれはタイトル1の内容です。\n",
          level: 2,
          children: [
            {
              type: "node",
              title: "### サブタイトル1-1",
              content: "\n\nこれはサブタイトル1-1の内容です。\n",
              level: 3,
              children: [],
            },
          ],
        },
        {
          type: "node",
          title: "## サブタイトル1-2",
          content: "\n\nこれはサブタイトル1-2の内容です。\n",
          level: 2,
          children: [],
        },
        {
          type: "node",
          title: "# トップレベルタイトル",
          content: "\n\nこれはトップレベルタイトルの内容です。",
          level: 1,
          children: [],
        },
      ],
    });
  });

  test("chunkMarkdownByLevel", async () => {
    expect(chunkMarkdownByLevel(parseMarkdown(markdown1), 2)).toStrictEqual([
      "## サブタイトル1-1\n\n\n\nこれはサブタイトル1-1の内容です。\n### サブサブタイトル1-1-1\n\n\n\nこれはサブサブタイトル1-1-1の内容です。\n",
      "## サブタイトル1-2\n\n\n\nこれはサブタイトル1-2の内容です。\n",
      "## サブタイトル2-1\n\n\n\nこれはサブタイトル2-1の内容です。",
    ]);
  });
});
