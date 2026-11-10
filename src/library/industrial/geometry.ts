/** Pure geometry for gauges, rings and meters. Angles are degrees, 0 at 12 o'clock, clockwise. */

export type Point = { x: number; y: number };

/** Start angle and sweep of the 270° gauge arc, open at the bottom. */
export const GAUGE_START_ANGLE = -135;
export const GAUGE_SWEEP = 270;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Position of a value in a range as 0–1, clamped. 0 when the range is empty. */
export function toFraction(value: number, min: number, max: number): number {
  if (!(max > min) || !Number.isFinite(value)) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function polarToCartesian(cx: number, cy: number, radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return { x: round2(cx + radius * Math.sin(radians)), y: round2(cy - radius * Math.cos(radians)) };
}

/** Angle on a gauge arc for a 0–1 fraction. */
export function fractionToAngle(fraction: number, start = GAUGE_START_ANGLE, sweep = GAUGE_SWEEP): number {
  return start + clamp(fraction, 0, 1) * sweep;
}

/** SVG path of a clockwise arc from `startAngle` to `endAngle`. Empty when the arc has no length. */
export function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  if (!(endAngle > startAngle)) return '';
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, Math.min(endAngle, startAngle + 359.99));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** `stroke-dasharray` that draws `fraction` of a circle of the given radius. */
export function ringDash(radius: number, fraction: number): string {
  const circumference = 2 * Math.PI * radius;
  const drawn = clamp(fraction, 0, 1) * circumference;
  return `${round2(drawn)} ${round2(circumference)}`;
}

/** Height a 270° gauge needs: the arc ends sit 45° below the centre line. */
export function gaugeHeight(cy: number, outerRadius: number, padding: number): number {
  return Math.ceil(cy + outerRadius * Math.cos(Math.PI / 4) + padding);
}
