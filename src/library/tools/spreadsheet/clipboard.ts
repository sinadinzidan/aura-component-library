/** Tab-separated text, the format spreadsheets put on the clipboard. */

const needsQuotes = (value: string): boolean => /["\t\n\r]/.test(value);

/** Rows of cell text as tab-separated lines. Cells holding a tab, a quote or a line break are quoted. */
export function serializeRange(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map((value) => (needsQuotes(value) ? `"${value.replace(/"/g, '""')}"` : value)).join('\t')).join('\n');
}

/**
 * Clipboard text as rows of cell text. Accepts `\n`, `\r\n` and `\r` line ends, quoted cells with
 * doubled quotes, and ignores the single trailing line break spreadsheets add. Empty text is no rows.
 */
export function parseClipboard(text: string): string[][] {
  if (text === '') return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let index = 0;

  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = '';
  };

  while (index < text.length) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 2;
        continue;
      }
      if (char === '"') quoted = false;
      else cell += char;
      index += 1;
      continue;
    }
    if (char === '"' && cell === '') {
      quoted = true;
    } else if (char === '\t') {
      row.push(cell);
      cell = '';
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      endRow();
      if (index === text.length - 1) return rows;
    } else {
      cell += char;
    }
    index += 1;
  }
  endRow();
  return rows;
}
