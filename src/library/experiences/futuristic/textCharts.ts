/** Pure text-mode charts: meters and plots made of block characters, one character per cell. */

export const METER_FULL = '█';
export const METER_PART = '▓';
export const METER_EMPTY = '░';

/** Eight levels, lowest first. */
export const SPARK_LEVELS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const;

const HALF_BLOCK = '▄';

export type TextDomain = readonly [number, number];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Min and max of the values. A flat or empty series gets a domain one unit either side. */
export function textDomain(values: readonly number[], include: readonly number[] = []): TextDomain {
  const all = [...values, ...include].filter((value) => Number.isFinite(value));
  if (all.length === 0) return [0, 1];
  const min = Math.min(...all);
  const max = Math.max(...all);
  return min === max ? [min - 1, max + 1] : [min, max];
}

/**
 * A bar of `width` cells for a 0–1 fraction: full blocks, one shaded cell when the remainder is
 * at least half a cell, then light cells. Always exactly `width` characters.
 */
export function textMeter(fraction: number, width: number): string {
  const cells = Math.max(0, Math.floor(width));
  const exact = clamp01(fraction) * cells;
  const full = Math.floor(exact + 1e-9);
  const part = full < cells && exact - full >= 0.5 ? 1 : 0;
  return METER_FULL.repeat(full) + METER_PART.repeat(part) + METER_EMPTY.repeat(cells - full - part);
}

/** Shrinks or keeps a series to at most `count` values by averaging equal buckets. */
export function resample(values: readonly number[], count: number): number[] {
  const target = Math.max(0, Math.floor(count));
  if (target === 0 || values.length === 0) return [];
  if (values.length <= target) return [...values];
  return Array.from({ length: target }, (_, index) => {
    const start = Math.floor((index * values.length) / target);
    const end = Math.max(start + 1, Math.floor(((index + 1) * values.length) / target));
    const bucket = values.slice(start, end);
    return bucket.reduce((sum, value) => sum + value, 0) / bucket.length;
  });
}

/** One-line sparkline: one of eight block heights per value. */
export function sparkChars(values: readonly number[], domain: TextDomain = textDomain(values)): string {
  const [min, max] = domain;
  const span = max - min || 1;
  return values
    .map((value) => SPARK_LEVELS[Math.min(SPARK_LEVELS.length - 1, Math.floor(clamp01((value - min) / span) * SPARK_LEVELS.length))])
    .join('');
}

/**
 * A column chart `rows` cells tall, top row first. Each column is filled from the bottom in half
 * cells, so a chart of 6 rows resolves 12 levels. Every column shows at least half a cell.
 */
export function columnChart(values: readonly number[], rows: number, domain: TextDomain = textDomain(values)): string[] {
  const height = Math.max(1, Math.floor(rows));
  const [min, max] = domain;
  const span = max - min || 1;
  const halves = values.map((value) => Math.max(1, Math.round(clamp01((value - min) / span) * height * 2)));
  return Array.from({ length: height }, (_, rowIndex) => {
    const rowFromBottom = height - 1 - rowIndex;
    return halves
      .map((filled) => {
        if (filled >= (rowFromBottom + 1) * 2) return METER_FULL;
        if (filled === rowFromBottom * 2 + 1) return HALF_BLOCK;
        return ' ';
      })
      .join('');
  });
}

/** Row (0 = top) in which a value such as a limit falls, or `null` when it is outside the domain. */
export function rowOfValue(value: number, rows: number, domain: TextDomain): number | null {
  const height = Math.max(1, Math.floor(rows));
  const [min, max] = domain;
  if (!(max > min) || value < min || value > max) return null;
  const fromBottom = Math.min(height - 1, Math.floor(((value - min) / (max - min)) * height));
  return height - 1 - fromBottom;
}
