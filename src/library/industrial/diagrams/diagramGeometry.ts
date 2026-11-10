/** Pure geometry for schematic diagrams: paths, routes and the points along them. */

export type Point = { x: number; y: number };

/** Compass direction of travel, used for flow arrows and ports. */
export type Direction = 'right' | 'left' | 'up' | 'down';

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A full circle as an absolute path, so a symbol can be described by path data alone. */
export function circlePath(cx: number, cy: number, radius: number): string {
  const left = round2(cx - radius);
  const right = round2(cx + radius);
  return `M ${left} ${cy} A ${radius} ${radius} 0 1 0 ${right} ${cy} A ${radius} ${radius} 0 1 0 ${left} ${cy} Z`;
}

/** An open path through the points. Empty with fewer than two points. */
export function polylinePath(points: readonly Point[]): string {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${round2(point.x)} ${round2(point.y)}`).join(' ');
}

/** Total length of a route. */
export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return round2(total);
}

/** Direction of travel from one point to the next; the larger axis wins on a diagonal. */
export function directionBetween(from: Point, to: Point): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

/** The opposite direction, for reverse flow. */
export function reverseDirection(direction: Direction): Direction {
  const opposite: Record<Direction, Direction> = { right: 'left', left: 'right', up: 'down', down: 'up' };
  return opposite[direction];
}

/** The point a 0–1 fraction of the way along a route, with the direction of the segment it sits on. */
export function pointAlong(points: readonly Point[], fraction: number): { point: Point; direction: Direction } | null {
  if (points.length < 2) return null;
  const total = polylineLength(points);
  if (total === 0) return null;
  let remaining = Math.min(1, Math.max(0, fraction)) * total;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length === 0) continue;
    if (remaining <= length || index === points.length - 1) {
      const ratio = Math.min(1, remaining / length);
      return {
        point: { x: round2(from.x + (to.x - from.x) * ratio), y: round2(from.y + (to.y - from.y) * ratio) },
        direction: directionBetween(from, to),
      };
    }
    remaining -= length;
  }
  return null;
}

/** Evenly spread positions for `count` arrows along a route: one sits in the middle, two at thirds. */
export function arrowPositions(points: readonly Point[], count: number): { point: Point; direction: Direction }[] {
  const positions: { point: Point; direction: Direction }[] = [];
  for (let index = 1; index <= count; index += 1) {
    const position = pointAlong(points, index / (count + 1));
    if (position) positions.push(position);
  }
  return positions;
}

/** A closed triangle centred on a point and pointing in a direction. */
export function arrowHeadPath(center: Point, direction: Direction, size: number): string {
  const half = size / 2;
  const { x, y } = center;
  const corners: Record<Direction, [Point, Point, Point]> = {
    right: [{ x: x - half, y: y - half }, { x: x + half, y }, { x: x - half, y: y + half }],
    left: [{ x: x + half, y: y - half }, { x: x - half, y }, { x: x + half, y: y + half }],
    down: [{ x: x - half, y: y - half }, { x, y: y + half }, { x: x + half, y: y - half }],
    up: [{ x: x - half, y: y + half }, { x, y: y - half }, { x: x + half, y: y + half }],
  };
  return `${polylinePath(corners[direction])} Z`;
}

/** A point on a symbol's own grid placed in the diagram, for a symbol of `size` centred on (cx, cy). */
export function placePoint(point: Point, grid: number, cx: number, cy: number, size: number): Point {
  const scale = size / grid;
  return { x: round2(cx - size / 2 + point.x * scale), y: round2(cy - size / 2 + point.y * scale) };
}

/** Rough width of a run of text at a font size; SVG cannot measure before it draws. */
export function estimateTextWidth(text: string, fontSize: number, monospace = false): number {
  return round2(text.length * fontSize * (monospace ? 0.62 : 0.56));
}
