/** Compass geometry for wind roses and other directional plots. Bearings are degrees clockwise from north. */

export type PolarPoint = { x: number; y: number };

const round = (value: number): number => Math.round(value * 100) / 100;

/** The eight compass points, clockwise from north. */
export const COMPASS_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** A point at `radius` from the centre on a compass bearing: 0° is up, 90° is right. */
export function bearingPoint(cx: number, cy: number, radius: number, bearing: number): PolarPoint {
  const radians = (bearing * Math.PI) / 180;
  return { x: round(cx + radius * Math.sin(radians)), y: round(cy - radius * Math.cos(radians)) };
}

/** Centre bearing of sector `index` when the circle is cut into `count` equal sectors starting at north. */
export function sectorBearing(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) * 360) / count;
}

/**
 * SVG path of a ring sector (a wedge with its tip cut off) between two radii, centred on a
 * bearing and `width` degrees wide. An inner radius of zero gives a plain wedge.
 */
export function sectorPath(cx: number, cy: number, innerRadius: number, outerRadius: number, bearing: number, width: number): string {
  const from = bearing - width / 2;
  const to = bearing + width / 2;
  const largeArc = width > 180 ? 1 : 0;
  const outerStart = bearingPoint(cx, cy, outerRadius, from);
  const outerEnd = bearingPoint(cx, cy, outerRadius, to);
  if (innerRadius <= 0) {
    return `M ${cx} ${cy} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} Z`;
  }
  const innerEnd = bearingPoint(cx, cy, innerRadius, to);
  const innerStart = bearingPoint(cx, cy, innerRadius, from);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/** Radius for a value on a linear scale from `innerRadius` (zero) to `outerRadius` (`max`). */
export function valueRadius(value: number, max: number, innerRadius: number, outerRadius: number): number {
  if (!(max > 0)) return innerRadius;
  const fraction = Math.min(1, Math.max(0, value / max));
  return round(innerRadius + fraction * (outerRadius - innerRadius));
}

/** Index of the largest value; the first one wins a tie. `-1` for an empty list. */
export function prevailingIndex(values: readonly number[]): number {
  return values.reduce((best, value, index) => (best === -1 || value > values[best] ? index : best), -1);
}
