/** Cell addresses and rectangular ranges for a spreadsheet grid. Rows and columns are zero-based. */

export type CellPos = { row: number; col: number };

/** A rectangle of cells. Corners may be in any order; `normalizeRange` sorts them. */
export type CellRange = { r1: number; c1: number; r2: number; c2: number };

/** "A" for 0, "Z" for 25, "AA" for 26. */
export function columnLabel(index: number): string {
  let label = '';
  let rest = Math.max(0, Math.floor(index));
  do {
    label = String.fromCharCode(65 + (rest % 26)) + label;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return label;
}

/** Zero-based column index of "A", "AB"; `null` when the text is not letters. */
export function columnIndex(label: string): number | null {
  if (!/^[A-Za-z]+$/.test(label)) return null;
  let index = 0;
  for (const letter of label.toUpperCase()) index = index * 26 + (letter.charCodeAt(0) - 64);
  return index - 1;
}

/** "B2" for row 1, column 1. */
export function cellLabel(pos: CellPos): string {
  return `${columnLabel(pos.col)}${pos.row + 1}`;
}

/** Position of "B2" (absolute markers `$` are accepted and ignored); `null` when it is not a reference. */
export function parseCellRef(text: string): CellPos | null {
  const match = /^\$?([A-Za-z]+)\$?([1-9][0-9]*)$/.exec(text.trim());
  if (!match) return null;
  const col = columnIndex(match[1]);
  if (col === null) return null;
  return { row: Number(match[2]) - 1, col };
}

/** Same rectangle with `r1 <= r2` and `c1 <= c2`. */
export function normalizeRange(range: CellRange): CellRange {
  return {
    r1: Math.min(range.r1, range.r2),
    c1: Math.min(range.c1, range.c2),
    r2: Math.max(range.r1, range.r2),
    c2: Math.max(range.c1, range.c2),
  };
}

export function rangeFrom(anchor: CellPos, focus: CellPos): CellRange {
  return normalizeRange({ r1: anchor.row, c1: anchor.col, r2: focus.row, c2: focus.col });
}

export function rangeContains(range: CellRange, pos: CellPos): boolean {
  const { r1, c1, r2, c2 } = normalizeRange(range);
  return pos.row >= r1 && pos.row <= r2 && pos.col >= c1 && pos.col <= c2;
}

export function rangeSize(range: CellRange): { rows: number; cols: number; cells: number } {
  const { r1, c1, r2, c2 } = normalizeRange(range);
  const rows = r2 - r1 + 1;
  const cols = c2 - c1 + 1;
  return { rows, cols, cells: rows * cols };
}

/** "B2" for one cell, "B2:C6" for more. */
export function rangeLabel(range: CellRange): string {
  const { r1, c1, r2, c2 } = normalizeRange(range);
  const start = cellLabel({ row: r1, col: c1 });
  return r1 === r2 && c1 === c2 ? start : `${start}:${cellLabel({ row: r2, col: c2 })}`;
}

/** Every position in the range, row by row. */
export function rangeCells(range: CellRange): CellPos[] {
  const { r1, c1, r2, c2 } = normalizeRange(range);
  const cells: CellPos[] = [];
  for (let row = r1; row <= r2; row += 1) for (let col = c1; col <= c2; col += 1) cells.push({ row, col });
  return cells;
}

/** Keeps a position inside a grid of `rows` by `cols`. */
export function clampPos(pos: CellPos, rows: number, cols: number): CellPos {
  return {
    row: Math.min(Math.max(pos.row, 0), Math.max(rows - 1, 0)),
    col: Math.min(Math.max(pos.col, 0), Math.max(cols - 1, 0)),
  };
}
