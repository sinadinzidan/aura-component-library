import { round2 } from '../../industrial/geometry';
import type { Point } from '../../industrial/geometry';

/**
 * One-point perspective for a floor that recedes to a horizon. Floor coordinates: `x` runs across
 * (−1 and 1 are the left and right ends of the near edge), `z` runs away from the viewer (0 is the
 * near edge) and `y` is height above the floor, in the same unit as `x`.
 */
export type GridView = {
  /** Size of the drawing in SVG user units. */
  width: number;
  height: number;
  /** Screen y of the horizon line. */
  horizonY: number;
  /** Screen y of the near edge of the floor. Defaults to the bottom of the drawing. */
  floorY?: number;
  /** Screen x of the vanishing point. Defaults to the centre. */
  vanishX?: number;
  /** Half the width of the floor at the near edge, in user units. Defaults to half the drawing. */
  nearHalfWidth?: number;
  /** How fast the floor shrinks with depth: scale = 1 / (1 + z · foreshortening). */
  foreshortening?: number;
};

export type FloorPoint = { x: number; z: number; y?: number };
export type Segment = { x1: number; y1: number; x2: number; y2: number };

export type FloorBlock = {
  /** Centre of the footprint. */
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
};

export type BlockFaces = {
  /** Footprint on the floor, for the shadow left behind when a block lifts. */
  base: Point[];
  front: Point[];
  top: Point[];
  /** The side that faces the vanishing point; `null` when the block straddles it. */
  side: Point[] | null;
  /** Top centre, where a label goes. */
  anchor: Point;
};

/** Scale of things at depth `z`: 1 at the near edge, towards 0 at the horizon. */
export function depthScale(view: GridView, z: number): number {
  const k = view.foreshortening ?? 1;
  return 1 / (1 + Math.max(z, 0) * k);
}

export function projectPoint(view: GridView, point: FloorPoint): Point {
  const vanishX = view.vanishX ?? view.width / 2;
  const floorY = view.floorY ?? view.height;
  const half = view.nearHalfWidth ?? view.width / 2;
  const scale = depthScale(view, point.z);
  return {
    x: round2(vanishX + point.x * half * scale),
    y: round2(view.horizonY + (floorY - view.horizonY) * scale - (point.y ?? 0) * half * scale),
  };
}

export type GridOptions = {
  /** Number of cells across and in depth. */
  columns: number;
  rows: number;
  xMin?: number;
  xMax?: number;
  /** Depth of the far edge of the grid. */
  zMax: number;
};

/** Floor grid lines: `columns + 1` converging lines and `rows + 1` lines across. */
export function gridLines(view: GridView, options: GridOptions): { converging: Segment[]; across: Segment[] } {
  const { columns, rows, xMin = -1, xMax = 1, zMax } = options;
  const converging: Segment[] = [];
  const across: Segment[] = [];
  for (let column = 0; column <= columns; column += 1) {
    const x = xMin + ((xMax - xMin) * column) / Math.max(columns, 1);
    const near = projectPoint(view, { x, z: 0 });
    const far = projectPoint(view, { x, z: zMax });
    converging.push({ x1: near.x, y1: near.y, x2: far.x, y2: far.y });
  }
  for (let row = 0; row <= rows; row += 1) {
    const z = (zMax * row) / Math.max(rows, 1);
    const left = projectPoint(view, { x: xMin, z });
    const right = projectPoint(view, { x: xMax, z });
    across.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y });
  }
  return { converging, across };
}

/** The visible faces of a box standing on the floor. */
export function blockFaces(view: GridView, block: FloorBlock): BlockFaces {
  const left = block.x - block.width / 2;
  const right = block.x + block.width / 2;
  const near = block.z - block.depth / 2;
  const far = block.z + block.depth / 2;
  const corner = (x: number, z: number, y: number) => projectPoint(view, { x, z, y });

  const base = [corner(left, near, 0), corner(right, near, 0), corner(right, far, 0), corner(left, far, 0)];
  const front = [corner(left, near, 0), corner(right, near, 0), corner(right, near, block.height), corner(left, near, block.height)];
  const top = [
    corner(left, near, block.height),
    corner(right, near, block.height),
    corner(right, far, block.height),
    corner(left, far, block.height),
  ];
  let side: Point[] | null = null;
  if (left > 0) {
    side = [corner(left, near, 0), corner(left, far, 0), corner(left, far, block.height), corner(left, near, block.height)];
  } else if (right < 0) {
    side = [corner(right, near, 0), corner(right, far, 0), corner(right, far, block.height), corner(right, near, block.height)];
  }
  const anchor = corner(block.x, block.z, block.height);
  return { base, front, top, side, anchor };
}

/** `points` attribute for a polygon or polyline. */
export function pointsAttribute(points: readonly Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

/** SVG path through floor points, for connector lines lying on the floor. */
export function floorPath(view: GridView, points: readonly FloorPoint[]): string {
  return points
    .map((point, index) => {
      const projected = projectPoint(view, point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
    })
    .join(' ');
}

/** Back-to-front drawing order, so nearer blocks cover farther ones. */
export function paintOrder<T extends { z: number }>(blocks: readonly T[]): T[] {
  return [...blocks].sort((a, b) => b.z - a.z);
}
