import * as fs from "node:fs";

export default async (): Promise<{ rule: string; filePattern: RegExp }[]> => {
  const markdown = await fs.promises.readFile("GUIDE.md", "utf-8");
  return markdown
    .split("## ")
    .map((rule) => `## ${rule}`)
    .filter(() => {
      /** some filter process */
      return true;
    })
    .map((rule) => {
      const [, filePattern = ".*"] = rule.match(/File Pattern: (.+)$/m) ?? [];
      return { rule, filePattern: RegExp(filePattern) };
    });
};
