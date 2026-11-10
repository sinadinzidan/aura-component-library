/** Geometry for profile lines: one value per stop along a route, drawn as a continuous line. */
export type ProfileBox = { width: number; height: number; paddingY: number };
export type ProfilePoint = { x: number; y: number };

/** Centre of stop `index` when the width is cut into `count` equal columns. */
export function stopX(index: number, count: number, width: number): number {
  if (count <= 0) return 0;
  return ((index + 0.5) / count) * width;
}

/** Lowest and highest value, widened when they are equal so a flat profile sits mid-height. */
export function profileDomain(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? [min - 1, max + 1] : [min, max];
}

/** One point per stop, each on its column centre, scaled into the box (high values at the top). */
export function profilePoints(values: readonly number[], box: ProfileBox, domain: [number, number] = profileDomain(values)): ProfilePoint[] {
  const [min, max] = domain;
  const span = max - min || 1;
  const usable = Math.max(box.height - box.paddingY * 2, 0);
  return values.map((value, index) => ({
    x: stopX(index, values.length, box.width),
    y: box.paddingY + (1 - (value - min) / span) * usable,
  }));
}

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * A smooth path through the points: horizontal tangents at every stop, so the line eases between
 * stops and never overshoots a value. Runs flat from the left edge to the first stop and from the
 * last stop to the right edge when `width` is given.
 */
export function profilePath(points: readonly ProfilePoint[], width?: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const start = width === undefined ? `M ${round(first.x)} ${round(first.y)}` : `M 0 ${round(first.y)} L ${round(first.x)} ${round(first.y)}`;
  const curves = points.slice(1).map((point, index) => {
    const previous = points[index] ?? point;
    const middle = round((previous.x + point.x) / 2);
    return `C ${middle} ${round(previous.y)} ${middle} ${round(point.y)} ${round(point.x)} ${round(point.y)}`;
  });
  const end = width === undefined ? [] : [`L ${round(width)} ${round(last.y)}`];
  return [start, ...curves, ...end].join(' ');
}
