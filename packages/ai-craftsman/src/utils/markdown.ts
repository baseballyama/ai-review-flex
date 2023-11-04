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

export const chunkMarkdownByLevel = (
  markdown: MarkdownSectionRoot,
  level: number
): string[] => {
  const getRule = (node: MarkdownSectionNode) => {
    let rule = `${node.title}\n\n${node.content}`;
    if (node.children.length > 0) {
      for (const child of node.children) {
        rule += getRule(child);
      }
    }
    return rule;
  };

  const rules: string[] = [];

  const search = (node: MarkdownSectionNode, level: number) => {
    if (node.level === level) {
      rules.push(getRule(node));
    }
    for (const child of node.children) {
      search(child, level);
    }
  };

  for (const child of markdown.children) {
    search(child, level);
  }
  return rules;
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
