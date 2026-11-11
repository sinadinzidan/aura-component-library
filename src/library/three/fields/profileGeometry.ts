/** A drawing area in SVG units with room around the plot for labels. */
export type ProfileFrame = { width: number; height: number; left: number; right: number; top: number; bottom: number };

export type ProfilePoint = { kp: number; value: number };

const round = (value: number): number => Math.round(value * 100) / 100;

/** Maps a chainage to an x coordinate inside the frame. */
export function xOfKp(frame: ProfileFrame, kp: number, totalKm: number): number {
  const inner = frame.width - frame.left - frame.right;
  const t = totalKm <= 0 ? 0 : Math.min(1, Math.max(0, kp / totalKm));
  return round(frame.left + t * inner);
}

/** Maps an x coordinate back to a chainage, clamped to the line. Used to seek by clicking the profile. */
export function kpOfX(frame: ProfileFrame, x: number, totalKm: number): number {
  const inner = frame.width - frame.left - frame.right;
  if (inner <= 0) return 0;
  return Math.min(1, Math.max(0, (x - frame.left) / inner)) * totalKm;
}

/** Maps a value to a y coordinate: `min` sits on the bottom edge of the plot, `max` on the top. */
export function yOfValue(frame: ProfileFrame, value: number, min: number, max: number): number {
  const inner = frame.height - frame.top - frame.bottom;
  const t = max === min ? 0.5 : (value - min) / (max - min);
  return round(frame.height - frame.bottom - Math.min(1, Math.max(0, t)) * inner);
}

/** The smallest and largest value of a series, widened by a fraction of the range so the line clears the edges. */
export function valueExtent(points: readonly ProfilePoint[], pad = 0.1): [number, number] {
  if (points.length === 0) return [0, 1];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  }
  const range = max - min || 1;
  return [min - range * pad, max + range * pad];
}

/** An open path through a series. Empty with fewer than two points. */
export function profileLinePath(frame: ProfileFrame, points: readonly ProfilePoint[], totalKm: number, min: number, max: number): string {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xOfKp(frame, point.kp, totalKm)} ${yOfValue(frame, point.value, min, max)}`).join(' ');
}

/** The same series closed down to the bottom of the plot, for a filled silhouette. */
export function profileAreaPath(frame: ProfileFrame, points: readonly ProfilePoint[], totalKm: number, min: number, max: number): string {
  const line = profileLinePath(frame, points, totalKm, min, max);
  if (line === '') return '';
  const floor = frame.height - frame.bottom;
  return `${line} L ${xOfKp(frame, points[points.length - 1].kp, totalKm)} ${floor} L ${xOfKp(frame, points[0].kp, totalKm)} ${floor} Z`;
}

/** The value of a series at a chainage, by linear interpolation; `null` for an empty series. */
export function valueAtKp(points: readonly ProfilePoint[], kp: number): number | null {
  if (points.length === 0) return null;
  if (kp <= points[0].kp) return points[0].value;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (kp <= to.kp) {
      const span = to.kp - from.kp;
      return span === 0 ? to.value : from.value + ((to.value - from.value) * (kp - from.kp)) / span;
    }
  }
  return points[points.length - 1].value;
}

/** Round chainages for axis ticks: every `step` kilometres, ends included. */
export function kpTicks(totalKm: number, step: number): number[] {
  if (totalKm <= 0 || step <= 0) return [0];
  const ticks: number[] = [];
  for (let kp = 0; kp < totalKm - step * 0.35; kp += step) ticks.push(kp);
  ticks.push(totalKm);
  return ticks;
}
