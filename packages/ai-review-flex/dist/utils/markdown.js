const walk = (node, enter) => {
    for (const child of node.children) {
        enter(child);
        walk(child, enter);
    }
};
export const chunkMarkdownByLevel = (markdown, level) => {
    const getRule = (node) => {
        let rule = `${node.title}\n\n${node.content}`;
        for (const child of node.children) {
            rule += getRule(child);
        }
        return rule;
    };
    const rules = [];
    const search = (node, level) => {
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
export const parseMarkdown = (markdown) => {
    const lines = markdown.split("\n");
    const root = {
        type: "root",
        children: [],
    };
    const getCurrentNode = () => {
        let current = root;
        while (true) {
            const buf = current.children[current.children.length - 1];
            if (buf == null)
                return current;
            current = buf;
        }
    };
    const getParentNode = (level) => {
        let parent = root;
        walk(root, (node) => {
            if (node.level === level) {
                parent = node;
            }
        });
        return parent;
    };
    for (const line of lines) {
        const level = line.match(/^\s*(#+)\s/)?.[1]?.length ?? -1;
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
