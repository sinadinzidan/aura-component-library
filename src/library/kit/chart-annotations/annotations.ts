/**
 * Geometry and small analyses behind an annotated trend: where a value sits on the plot, where a
 * series crosses a limit, where its extremes are. Positions are shares of the plot, 0–1.
 */

export type Domain = readonly [number, number];

/** A y range that fits every value and every extra figure (limits), with a little air. */
export function fitDomain(values: readonly (number | null)[], extra: readonly number[] = [], padding = 0.08): Domain {
  const numbers = [...values.filter((value): value is number => value !== null), ...extra];
  if (numbers.length === 0) return [0, 1];
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const span = max - min || Math.abs(max) || 1;
  return [min - span * padding, max + span * padding];
}

/** Share of the plot width for a point index. A single point sits in the middle. */
export function xShare(index: number, count: number): number {
  return count > 1 ? Math.min(1, Math.max(0, index / (count - 1))) : 0.5;
}

/** Share of the plot height from the top for a value. */
export function yShare(value: number, domain: Domain): number {
  const span = domain[1] - domain[0] || 1;
  return Math.min(1, Math.max(0, 1 - (value - domain[0]) / span));
}

/** Evenly spaced tick values across a domain, both ends included. */
export function domainTicks(domain: Domain, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / count);
}

/** The point index nearest to a horizontal share of the plot. */
export function nearestIndex(share: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.round(share * (count - 1))));
}

export type Crossing = { index: number; direction: 'up' | 'down' };

/** Every point at which the series moves from one side of the limit to the other. */
export function findCrossings(values: readonly (number | null)[], limit: number): Crossing[] {
  const crossings: Crossing[] = [];
  let previous: number | null = null;
  values.forEach((value, index) => {
    if (value === null) return;
    if (previous !== null && previous <= limit && value > limit) crossings.push({ index, direction: 'up' });
    if (previous !== null && previous > limit && value <= limit) crossings.push({ index, direction: 'down' });
    previous = value;
  });
  return crossings;
}

export type Extremes = { minIndex: number; maxIndex: number; min: number; max: number };

/** Index and value of the lowest and highest point; `null` when there is nothing to compare. */
export function findExtremes(values: readonly (number | null)[]): Extremes | null {
  let result: Extremes | null = null;
  values.forEach((value, index) => {
    if (value === null) return;
    if (result === null) {
      result = { minIndex: index, maxIndex: index, min: value, max: value };
      return;
    }
    if (value < result.min) result = { ...result, min: value, minIndex: index };
    if (value > result.max) result = { ...result, max: value, maxIndex: index };
  });
  return result;
}

export type RangeSummary = { count: number; min: number; max: number; mean: number; change: number };

/** Figures for a selected stretch of a series, ends included. */
export function summarizeRange(values: readonly (number | null)[], from: number, to: number): RangeSummary | null {
  const [start, end] = from <= to ? [from, to] : [to, from];
  const picked = values.slice(Math.max(0, Math.round(start)), Math.round(end) + 1).filter((value): value is number => value !== null);
  if (picked.length === 0) return null;
  const sum = picked.reduce((total, value) => total + value, 0);
  return { count: picked.length, min: Math.min(...picked), max: Math.max(...picked), mean: sum / picked.length, change: picked[picked.length - 1] - picked[0] };
}

/** An SVG path through the points in a 0–100 box; gaps (`null`) break the line. */
export function linePath(values: readonly (number | null)[], domain: Domain, curve: 'linear' | 'monotone' | 'stepAfter', from = 0, to = values.length - 1): string {
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  for (let index = Math.max(0, from); index <= Math.min(values.length - 1, to); index += 1) {
    const value = values[index];
    if (value === null) {
      if (run.length > 0) runs.push(run);
      run = [];
      continue;
    }
    run.push({ x: xShare(index, values.length) * 100, y: yShare(value, domain) * 100 });
  }
  if (run.length > 0) runs.push(run);
  const at = (point: { x: number; y: number }): string => `${point.x.toFixed(2)},${point.y.toFixed(2)}`;

  return runs
    .map((points) =>
      points
        .map((point, index) => {
          if (index === 0) return `M${at(point)}`;
          const previous = points[index - 1];
          if (curve === 'stepAfter') return `H${point.x.toFixed(2)}V${point.y.toFixed(2)}`;
          if (curve === 'linear') return `L${at(point)}`;
          // Catmull-Rom through the neighbours, so the curve passes every point without steps.
          const before = points[index - 2] ?? previous;
          const after = points[index + 1] ?? point;
          const first = { x: previous.x + (point.x - before.x) / 6, y: previous.y + (point.y - before.y) / 6 };
          const second = { x: point.x - (after.x - previous.x) / 6, y: point.y - (after.y - previous.y) / 6 };
          return `C${at(first)} ${at(second)} ${at(point)}`;
        })
        .join('')
    )
    .join('');
}
