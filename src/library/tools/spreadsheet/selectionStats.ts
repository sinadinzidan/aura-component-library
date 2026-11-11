import { normalizeRange } from './cellRef';
import type { CellRange } from './cellRef';
import type { CellResult } from './formula';

export type SelectionStats = {
  /** Cells in the range that are not empty. */
  count: number;
  /** Cells that hold a number. */
  numericCount: number;
  sum: number;
  /** `null` when there is no number to average. */
  average: number | null;
  min: number | null;
  max: number | null;
};

/** Count, sum, average, minimum and maximum of the evaluated cells in a range. Errors and text count as filled, never as numbers. */
export function selectionStats(results: readonly (readonly CellResult[])[], range: CellRange): SelectionStats {
  const { r1, c1, r2, c2 } = normalizeRange(range);
  const numbers: number[] = [];
  let count = 0;
  for (let row = r1; row <= r2; row += 1) {
    for (let col = c1; col <= c2; col += 1) {
      const cell = results[row]?.[col];
      if (cell === undefined || cell.kind === 'empty') continue;
      count += 1;
      if (cell.kind === 'number') numbers.push(cell.value);
    }
  }
  const sum = numbers.reduce((total, value) => total + value, 0);
  return {
    count,
    numericCount: numbers.length,
    sum,
    average: numbers.length === 0 ? null : sum / numbers.length,
    min: numbers.length === 0 ? null : Math.min(...numbers),
    max: numbers.length === 0 ? null : Math.max(...numbers),
  };
}
