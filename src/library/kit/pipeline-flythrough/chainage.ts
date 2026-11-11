/**
 * Small pure helpers for a chainage profile: where a kilometre sits across the plot, which
 * kilometre a pointer position means, round axis ticks and the stretch of line a reader is in.
 */

/** A chainage as a 0–100 share of the line, clamped to the line. */
export function kpPercent(kp: number, totalKm: number): number {
  if (totalKm <= 0) return 0;
  return Math.min(100, Math.max(0, (kp / totalKm) * 100));
}

/** The chainage under a pointer at `x` in a plot `width` wide, rounded to `stepKm`. */
export function kpAtPointer(x: number, width: number, totalKm: number, stepKm = 0.1): number {
  if (width <= 0) return 0;
  const raw = Math.min(1, Math.max(0, x / width)) * totalKm;
  return Number((Math.round(raw / stepKm) * stepKm).toFixed(4));
}

/** Round values from `min` to `max` inclusive, `step` apart, for an axis. */
export function axisTicks(min: number, max: number, step: number): number[] {
  if (step <= 0 || max < min) return [];
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max + 1e-9; value += step) ticks.push(Number(value.toFixed(6)));
  return ticks;
}

/** The pair of stations a chainage lies between; at a station it is the stretch that starts there. */
export function stretchAt<Station extends { kp: number }>(stations: readonly Station[], kp: number): { from: Station; to: Station } | null {
  const sorted = [...stations].sort((a, b) => a.kp - b.kp);
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    if (from && to && kp >= from.kp && (kp < to.kp || index === sorted.length - 2)) return { from, to };
  }
  return null;
}

/** Metres climbed and descended between two chainages of an elevation series sampled every `stepKm`. */
export function climbBetween(elevationAt: (kp: number) => number, fromKp: number, toKp: number, stepKm = 1): { up: number; down: number } {
  let up = 0;
  let down = 0;
  for (let kp = fromKp; kp < toKp; kp += stepKm) {
    const delta = elevationAt(Math.min(kp + stepKm, toKp)) - elevationAt(kp);
    if (delta > 0) up += delta;
    else down -= delta;
  }
  return { up: Math.round(up), down: Math.round(down) };
}

/**
 * Which row each label along a line goes on so neighbours do not run into each other: 0 is the
 * row next to the plot, 1 the row above it. A label moves up when it follows the previous one by
 * less than `minGapPercent` of the line and that one stayed down. Positions must be sorted.
 */
export function staggerRows(positions: readonly number[], totalKm: number, minGapPercent = 9): number[] {
  const rows: number[] = [];
  positions.forEach((kp, index) => {
    const previous = positions[index - 1];
    const close = previous !== undefined && kpPercent(kp, totalKm) - kpPercent(previous, totalKm) < minGapPercent;
    rows.push(close && rows[index - 1] === 0 ? 1 : 0);
  });
  return rows;
}
