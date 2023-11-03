import { describe, test, expect } from "vitest";
import { parseMarkdown } from "./markdown";

describe("markdown", () => {
  test("parseMarkdown", async () => {
    const markdown = `\
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
    expect(parseMarkdown(markdown)).toStrictEqual({
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
  });
});
