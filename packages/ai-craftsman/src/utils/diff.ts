export interface Diff {
  startRow: number;
  endRow: number;
  diff: string;
  type: "add" | "delete" | "modify";
}

export const splitForEachDiff = (diff: string): Diff[] => {
  const lines = diff.split("\n");
  const header = lines[0];
  const index = lines[1];
  const minus = lines[2];
  const plus = lines[3];

  const diffs: Diff[] = [];
  let diffLines: string[] = [];
  const currentDiffLines = { start: 0, end: 0 };

  const flush = () => {
    const hasAdd = diffLines.some((l) => l.startsWith("+"));
    const hasDelete = diffLines.some((l) => l.startsWith("-"));
    const type = hasAdd && hasDelete ? "modify" : hasAdd ? "add" : "delete";
    const diffBody = diffLines.reduce((acc, cur, index) => {
      const rawNumber = currentDiffLines.start + index;
      const line = `${rawNumber + index} ${cur}`;
      if (acc === "") return line;
      return `${acc}\n${line}`;
    }, "");
    diffs.push({
      startRow: currentDiffLines.start,
      endRow: currentDiffLines.end,
      diff: `${header}\n${index}\n${minus}\n${plus}\n${diffBody}`,
      type,
    });
  };

  for (const line of lines.slice(5)) {
    if (line.startsWith("@@")) {
      if (diffLines.length > 0) {
        flush();
      }
      diffLines = [line];
      const [start, end] = line.match(/\+(\d+),(\d+)/)?.slice(1) ?? [];
      currentDiffLines.start = Number(start) || 0;
      currentDiffLines.end = Number(end) || currentDiffLines.start;
    } else {
      diffLines.push(line);
    }
  }

  if (diffLines.length > 0) {
    flush();
  }

  return diffs;
};
