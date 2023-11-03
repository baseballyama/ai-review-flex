interface ChunkedSource {
  source: string;
  startRow: number;
  endRow: number;
}

export interface SourceRow {
  source: string;
  level: number;
}

export interface Diff {
  startRow: number;
  endRow: number;
  diff: string;
}

export const parse = (source: string): SourceRow[] => {
  const rows: SourceRow[] = [];
  const lines = source.split("\n");
  for (const line of lines) {
    const level = line.match(/^[\s\t]*/)?.[0]?.length ?? 0;
    rows.push({ source: line, level });
  }
  return rows;
};

export const splitForEachDIff = (source: string): Diff[] => {
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

export const chunk = ({
  source,
  counter,
  maxCount,
  duplicateLines = 0,
}: {
  source: string;
  counter: (str: string) => number;
  maxCount: number;
  duplicateLines?: number;
}): ChunkedSource[] => {
  const getChunkedSource = (currentIndex: number): ChunkedSource => {
    const currentLine = parsed[currentIndex]?.source;
    const prevLine = parsed[currentIndex - 1]?.source ?? "";
    const prevPrevLine = parsed[currentIndex - 2]?.source ?? "";
    let source = prevPrevLine;
    if (source.length > 0) source += "\n";
    source += prevLine;
    if (source.length > 0) source += "\n";
    source += currentLine;
    const row = Math.max(0, currentIndex - duplicateLines);
    return { source, startRow: row, endRow: row };
  };

  const chunks: ChunkedSource[] = [];
  let cur: ChunkedSource = { source: "", startRow: 0, endRow: 0 };
  const parsed = parse(source);
  parsed.forEach((line, index) => {
    if (counter(`${cur.source}${line.source.length}`) > maxCount) {
      chunks.push(cur);
      cur = getChunkedSource(index);
    } else {
      cur.source += line.source + "\n";
      cur.endRow = index;
    }
  });
  if (cur.source.length > 0) {
    chunks.push(cur);
  }

  return chunks;
};
