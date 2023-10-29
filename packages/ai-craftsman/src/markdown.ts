import { readFileSync } from "node:fs";

export interface MarkdownSectionNode {
  type: "node";
  title: string;
  content: string;
  level: number;
  children: MarkdownSectionNode[];
}

export interface MarkdownSectionRoot {
  type: "root";
  children: MarkdownSectionNode[];
}

export const parseMarkdownFromFile = (path: string): MarkdownSectionRoot => {
  return parseMarkdown(readFileSync(path, "utf-8"));
};

export const parseMarkdown = (markdown: string): MarkdownSectionRoot => {
  const lines = markdown.split("\n");
  const root: MarkdownSectionRoot = {
    type: "root",
    children: [],
  };

  const getCurrentNode = (): MarkdownSectionRoot | MarkdownSectionNode => {
    let current: MarkdownSectionRoot | MarkdownSectionNode = root;
    while (true) {
      const buf: MarkdownSectionNode | undefined =
        current.children[current.children.length - 1];
      if (buf == null) return current;
      current = buf;
    }
  };

  const getParentNode = (
    level: number
  ): MarkdownSectionRoot | MarkdownSectionNode => {
    let parent: MarkdownSectionRoot | MarkdownSectionNode = root;
    for (let i = 0; i < level; i++) {
      const buf: MarkdownSectionNode | undefined =
        parent.children[parent.children.length - 1];
      if (buf == null) return parent;
      parent = buf;
    }
    return parent;
  };

  for (const line of lines) {
    const level = (line.match(/^#+\s/)?.[0]?.length ?? 0) - 1;
    const title = line.trim();

    if (level === -1) {
      const current = getCurrentNode();
      if (current.type === "node") {
        current.content += "\n" + line;
      }
      continue;
    }

    const parent = getParentNode(level - 1);
    parent.children.push({
      type: "node",
      title,
      content: "",
      level,
      children: [],
    });
  }

  return root;
};
