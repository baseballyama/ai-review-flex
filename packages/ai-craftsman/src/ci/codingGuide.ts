import * as fs from "node:fs";
import { parseMarkdown, chunkMarkdownByLevel } from "../utils/markdown.js";

export default async (): Promise<string[]> => {
  const markdown = await fs.promises.readFile("GUIDE.md", "utf-8");
  const parsed = parseMarkdown(markdown);
  return chunkMarkdownByLevel(parsed, 2).filter((chunk) => {
    return chunk.match(/AI Review.*ON/g);
  });
};
