/** Small statistics for word-sized trends. Gaps (`null`) are skipped everywhere. */

export type Change = { absolute: number; percent: number; direction: 'up' | 'down' | 'flat' };

/** Change from the first to the last value present. `flat` when it is within `tolerance`. */
export function changeOf(values: ReadonlyArray<number | null>, tolerance = 0): Change {
  const present = values.filter((value): value is number => value !== null);
  if (present.length < 2) return { absolute: 0, percent: 0, direction: 'flat' };
  const absolute = present[present.length - 1] - present[0];
  const percent = present[0] === 0 ? 0 : (absolute / Math.abs(present[0])) * 100;
  const direction = Math.abs(absolute) <= tolerance ? 'flat' : absolute > 0 ? 'up' : 'down';
  return { absolute, percent, direction };
}

/** True when the signal has not moved more than `tolerance`: a frozen transmitter, not a calm process. */
export function isFrozen(values: ReadonlyArray<number | null>, tolerance = 0): boolean {
  const present = values.filter((value): value is number => value !== null);
  if (present.length < 2) return false;
  return Math.max(...present) - Math.min(...present) <= tolerance;
}

/** Indexes of the lowest and the highest value, or `null` when there is no data. */
export function extremes(values: ReadonlyArray<number | null>): { min: number; max: number } | null {
  let min = -1;
  let max = -1;
  values.forEach((value, index) => {
    if (value === null) return;
    const low = min === -1 ? null : values[min];
    const high = max === -1 ? null : values[max];
    if (low === null || low === undefined || value < low) min = index;
    if (high === null || high === undefined || value > high) max = index;
  });
  return min === -1 ? null : { min, max };
}

/** Share of the values present that sit at or above `limit`, 0–1. */
export function shareAbove(values: ReadonlyArray<number | null>, limit: number): number {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return 0;
  return present.filter((value) => value >= limit).length / present.length;
}
