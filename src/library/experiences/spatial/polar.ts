import { polarToCartesian, round2 } from '../../industrial/geometry';
import type { Point } from '../../industrial/geometry';

/**
 * Pure layout maths for dial-centred screens. Angles are degrees, 0 at 12 o'clock, clockwise —
 * the same convention as the gauges — so 90 is 3 o'clock.
 */

export type AngleRange = { start: number; end: number };

export type Spoke = { x1: number; y1: number; x2: number; y2: number };

/** The 3 o'clock position, where a selected node comes to rest. */
export const FOCUS_ANGLE = 90;

/** An angle folded into 0 ≤ angle < 360. */
export function normalizeAngle(angle: number): number {
  const folded = angle % 360;
  return round2(folded < 0 ? folded + 360 : folded);
}

/** The signed turn from one angle to another by the shorter way, in −180 < turn ≤ 180. */
export function shortestTurn(from: number, to: number): number {
  const turn = normalizeAngle(to - from);
  return turn > 180 ? round2(turn - 360) : turn;
}

/** Resting angles of `count` nodes spread evenly round a circle, the first at `offset`. */
export function orbitAngles(count: number, offset = 0): number[] {
  if (!(count > 0)) return [];
  return Array.from({ length: Math.floor(count) }, (_, index) => round2(offset + (index * 360) / Math.floor(count)));
}

/**
 * Rotation of the whole orbit that brings the node resting at `nodeAngle` to the focus position.
 * It continues from `currentRotation` by the shorter way, so the ring never spins the long way
 * round and the returned value can be animated directly.
 */
export function rotationToFocus(nodeAngle: number, currentRotation = 0, focusAngle = FOCUS_ANGLE): number {
  return round2(currentRotation + shortestTurn(nodeAngle + currentRotation, focusAngle));
}

/** Angle of an hour on a clock ring that makes one turn in `hoursPerTurn`, midnight at the top. */
export function hourAngle(hour: number, hoursPerTurn = 24): number {
  if (!(hoursPerTurn > 0)) return 0;
  return normalizeAngle((hour / hoursPerTurn) * 360);
}

/** `count` equal segments fanned across `spread` degrees centred on `centre`, with `gap` between them. */
export function fanAngles(count: number, centre: number, spread: number, gap = 2): AngleRange[] {
  if (!(count > 0)) return [];
  const whole = Math.floor(count);
  const width = (spread - gap * (whole - 1)) / whole;
  if (!(width > 0)) return [];
  const first = centre - spread / 2;
  return Array.from({ length: whole }, (_, index) => {
    const start = round2(first + index * (width + gap));
    return { start, end: round2(start + width) };
  });
}

/** A point on a circle. */
export function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  return polarToCartesian(cx, cy, radius, angle);
}

/** A radial line between two radii at one angle. */
export function spoke(cx: number, cy: number, innerRadius: number, outerRadius: number, angle: number): Spoke {
  const inner = polarToCartesian(cx, cy, innerRadius, angle);
  const outer = polarToCartesian(cx, cy, outerRadius, angle);
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
}

/** Closed path of a ring segment between two radii and two angles. Empty when it has no area. */
export function annularSectorPath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  if (!(endAngle > startAngle) || !(outerRadius > innerRadius)) return '';
  const end = Math.min(endAngle, startAngle + 359.99);
  const largeArc = end - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, end);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, end);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}
