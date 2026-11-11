/** Geometry for ring charts drawn in a 200 by 200 viewBox. */
const CENTER = 100;

const point = (radius: number, angle: number): string => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return `${(CENTER + radius * Math.cos(radians)).toFixed(2)} ${(CENTER + radius * Math.sin(radians)).toFixed(2)}`;
};

/** An annular sector between two angles in degrees, clockwise from twelve o'clock. */
export function sectorPath(from: number, to: number, inner: number, outer: number): string {
  const large = to - from > 180 ? 1 : 0;
  return `M ${point(outer, from)} A ${outer} ${outer} 0 ${large} 1 ${point(outer, to)} L ${point(inner, to)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, from)} Z`;
}
