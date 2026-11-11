/**
 * Polar geometry for dials, scopes and ring charts drawn in SVG. Angles are in degrees, measured
 * clockwise from twelve o'clock, the way a clock or a compass reads.
 */

export type Point = { x: number; y: number };

const round = (value: number): number => Number(value.toFixed(2));

/** The point at `radius` from the centre in the direction `angle`. */
export function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: round(cx + radius * Math.cos(radians)), y: round(cy + radius * Math.sin(radians)) };
}

/** An open arc along a circle, for a stroked ring segment. */
export function arcLine(cx: number, cy: number, radius: number, start: number, end: number): string {
  const sweep = Math.min(Math.max(end - start, 0), 359.99);
  const from = polarPoint(cx, cy, radius, start);
  const to = polarPoint(cx, cy, radius, start + sweep);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${to.x} ${to.y}`;
}

/** A closed ring segment between two radii, for a filled arc or a wedge (`inner` 0). */
export function arcBand(cx: number, cy: number, outer: number, inner: number, start: number, end: number): string {
  const sweep = Math.min(Math.max(end - start, 0), 359.99);
  const large = sweep > 180 ? 1 : 0;
  const a = polarPoint(cx, cy, outer, start);
  const b = polarPoint(cx, cy, outer, start + sweep);
  if (inner <= 0) return `M ${cx} ${cy} L ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} Z`;
  const c = polarPoint(cx, cy, inner, start + sweep);
  const d = polarPoint(cx, cy, inner, start);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`;
}

/** Maps a value on a range to an angle on a dial that runs from `start` to `end` degrees. */
export function valueAngle(value: number, min: number, max: number, start: number, end: number): number {
  const share = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  return start + share * (end - start);
}

/** Brings any angle into 0–360. */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}
