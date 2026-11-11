export type DiffLine = { type: 'same' | 'add' | 'remove'; text: string; oldLine: number | null; newLine: number | null };

/** A line-by-line difference between two texts, from the longest common run of lines. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === '' ? [] : before.split('\n');
  const b = after === '' ? [] : after.split('\n');
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ type: 'same', text: a[i], oldLine: i + 1, newLine: j + 1 });
      i += 1;
      j += 1;
    } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) {
      lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
      j += 1;
    } else {
      lines.push({ type: 'remove', text: a[i], oldLine: i + 1, newLine: null });
      i += 1;
    }
  }
  return lines;
}

/** How many lines were added and removed. */
export function diffSummary(lines: readonly DiffLine[]): { added: number; removed: number } {
  return { added: lines.filter((line) => line.type === 'add').length, removed: lines.filter((line) => line.type === 'remove').length };
}
