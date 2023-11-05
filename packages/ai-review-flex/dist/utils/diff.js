export const splitForEachDiff = (diff) => {
    const lines = diff.split("\n");
    const diffs = [];
    let diffLines = [];
    const currentDiffLines = { start: 1, end: 1 };
    const flush = () => {
        const hasAdd = diffLines.some((l) => l.startsWith("+"));
        const hasDelete = diffLines.some((l) => l.startsWith("-"));
        const type = hasAdd && hasDelete ? "modify" : hasAdd ? "add" : "delete";
        let currentRowNumber = currentDiffLines.start - 1;
        const diffBody = diffLines.reduce((acc, cur) => {
            const isDelete = cur.startsWith("-");
            if (isDelete)
                return acc;
            currentRowNumber += 1;
            const line = `${currentRowNumber} ${cur}`;
            if (acc === "")
                return line;
            return `${acc}\n${line}`;
        }, "");
        diffs.push({
            startRow: currentDiffLines.start,
            endRow: currentDiffLines.end,
            diff: diffBody,
            type,
        });
    };
    for (const line of lines.slice(4)) {
        const isHank = line.startsWith("@@");
        if (isHank) {
            if (diffLines.length > 0) {
                flush();
            }
            diffLines = [];
            const [, start, end] = line.match(/@@ -\d+,\d+ \+(\d+),(\d+) @@/) ?? [];
            currentDiffLines.start = Number(start) || 0;
            currentDiffLines.end = Number(end) || currentDiffLines.start;
        }
        else {
            diffLines.push(line);
        }
    }
    if (diffLines.length > 0) {
        flush();
    }
    return diffs;
};
