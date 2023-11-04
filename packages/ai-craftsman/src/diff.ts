export interface Diff {
  startRow: number;
  endRow: number;
  diff: string;
}

export const parse = (source: string): Diff[] => {
  const lines = source.split("\n");
  const diff = lines[0];
  const index = lines[1];
  const minus = lines[2];
  const plus = lines[3];

  const diffs: Diff[] = [];
  let buf = "";
  const currentDiffLines = { start: 0, end: 0 };

  const flush = () => {
    diffs.push({
      startRow: currentDiffLines.start,
      endRow: currentDiffLines.end,
      diff: `${diff}\n${index}\n${minus}\n${plus}\n${buf}`,
    });
  };

  let currentRawNumber = 4;

  for (const line of lines.slice(5)) {
    if (line.startsWith("@@")) {
      if (buf.length > 0) {
        flush();
      }
      buf = line;
      const [start, end] = line.match(/\+(\d+),(\d+)/)?.slice(1) ?? [];
      currentDiffLines.start = Number(start) || 0;
      currentDiffLines.end = Number(end) || currentDiffLines.start;
      currentRawNumber = currentDiffLines.start;
    } else {
      buf += "\n" + `${currentRawNumber} ${line}`;
      currentRawNumber++;
    }
  }

  if (buf.length > 0) {
    flush();
  }

  return diffs;
};
