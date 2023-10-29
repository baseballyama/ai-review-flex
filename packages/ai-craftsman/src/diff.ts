interface ChunkedSource {
  source: string;
  startRow: number;
  endRow: number;
}

export interface SourceRow {
  source: string;
  level: number;
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
