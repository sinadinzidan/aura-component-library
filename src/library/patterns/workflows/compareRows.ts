import { changeBetween } from './changeKind';
import type { ChangeKind } from './changeKind';

export type CompareDelta = {
  /** Already formatted, with sign and unit: "+3.0 °C". */
  text: string;
  direction: 'up' | 'down' | 'flat';
};

export type CompareRow = {
  id: string;
  /** The field being compared. */
  label: string;
  /** Value on each side, already formatted. Leave out when the side has no value. */
  left?: string;
  right?: string;
  /** Difference between the sides, for numeric fields. */
  delta?: CompareDelta;
  /** Overrides the kind derived from the two values. */
  change?: ChangeKind;
  /** Monospace values, for tags and ids. */
  mono?: boolean;
};

/** The kind of change of a row: its override, or what its two values say. */
export const rowChange = (row: CompareRow): ChangeKind => row.change ?? changeBetween(row.left, row.right);

/** How many rows differ between the sides. */
export const countDifferences = (rows: readonly CompareRow[]): number => rows.filter((row) => rowChange(row) !== 'unchanged').length;

/** Signed difference of two numbers as a delta: "+3.0 °C", up. A true minus sign for negatives. */
export function numericDelta(left: number, right: number, decimals = 1, unit?: string): CompareDelta {
  const difference = right - left;
  const rounded = Number(difference.toFixed(decimals));
  const sign = rounded > 0 ? '+' : rounded < 0 ? '\u2212' : '±';
  const text = `${sign}${Math.abs(rounded).toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
  return { text, direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat' };
}
