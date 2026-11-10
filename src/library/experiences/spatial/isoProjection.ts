/**
 * Pure isometric projection for 2.5D drawings in SVG. World axes: x runs down-right, y runs
 * down-left, z runs up. The viewer looks from the +x, +y, +z corner, so a larger x or y is
 * nearer and lower on the screen.
 */

export type IsoPoint = { x: number; y: number };

/** World position of a point. */
export type IsoVector = { x: number; y: number; z: number };

/** An axis-aligned box: `w` along x, `d` along y, `h` along z, from its lowest corner. */
export type IsoBox = { x: number; y: number; z: number; w: number; d: number; h: number };

/** Screen pixels per world unit, and where the world origin lands on the screen. */
export type IsoView = { scale: number; originX: number; originY: number };

export type IsoPrismFaces = { top: string; left: string; right: string };

export type IsoAxis = 'x' | 'y' | 'z';

export type IsoCylinderSpec = {
  /** Centre of the base cap. */
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Length along the axis. */
  length: number;
  axis?: IsoAxis;
};

export type IsoCylinderShape = { body: string; farCap: string; nearCap: string };

const COS_30 = Math.sqrt(3) / 2;
const SIN_30 = 0.5;
const EPSILON = 1e-6;

export const DEFAULT_ISO_VIEW: IsoView = { scale: 1, originX: 0, originY: 0 };

function round2(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return rounded === 0 ? 0 : rounded;
}

/** Projects a world point to the screen. */
export function iso(x: number, y: number, z = 0, view: IsoView = DEFAULT_ISO_VIEW): IsoPoint {
  return {
    x: round2(view.originX + (x - y) * COS_30 * view.scale),
    y: round2(view.originY + ((x + y) * SIN_30 - z) * view.scale),
  };
}

/** SVG `points` text for a list of screen points. */
export function toPoints(points: readonly IsoPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

/** The three visible faces of a box as polygon points: top, left (the +y side) and right (the +x side). */
export function prismFaces(box: IsoBox, view: IsoView = DEFAULT_ISO_VIEW): IsoPrismFaces {
  const { x, y, z, w, d, h } = box;
  const p = (px: number, py: number, pz: number) => iso(px, py, pz, view);
  return {
    top: toPoints([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)]),
    left: toPoints([p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)]),
    right: toPoints([p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)]),
  };
}

/** Screen position of the middle of a box's top face — where a label or callout anchors. */
export function boxAnchor(box: IsoBox, view: IsoView = DEFAULT_ISO_VIEW): IsoPoint {
  return iso(box.x + box.w / 2, box.y + box.d / 2, box.z + box.h, view);
}

/** A circle of `radius` round `centre`, lying across `axis`, as screen points. */
export function isoCircle(centre: IsoVector, radius: number, axis: IsoAxis = 'z', view: IsoView = DEFAULT_ISO_VIEW, segments = 28): IsoPoint[] {
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * 2 * Math.PI;
    const a = Math.cos(angle) * radius;
    const b = Math.sin(angle) * radius;
    if (axis === 'z') return iso(centre.x + a, centre.y + b, centre.z, view);
    if (axis === 'x') return iso(centre.x, centre.y + a, centre.z + b, view);
    return iso(centre.x + a, centre.y, centre.z + b, view);
  });
}

function offsetAlong(spec: IsoCylinderSpec, distance: number): IsoVector {
  const axis = spec.axis ?? 'z';
  return {
    x: spec.x + (axis === 'x' ? distance : 0),
    y: spec.y + (axis === 'y' ? distance : 0),
    z: spec.z + (axis === 'z' ? distance : 0),
  };
}

/**
 * A cylinder as three polygons: the far cap, the body between the two silhouette edges, and the
 * near cap, which is the visible one. Draw them in that order.
 */
export function cylinderShape(spec: IsoCylinderSpec, view: IsoView = DEFAULT_ISO_VIEW, segments = 28): IsoCylinderShape {
  const axis = spec.axis ?? 'z';
  const far = isoCircle(offsetAlong(spec, 0), spec.radius, axis, view, segments);
  const near = isoCircle(offsetAlong(spec, spec.length), spec.radius, axis, view, segments);
  const farCentre = iso(spec.x, spec.y, spec.z, view);
  const end = offsetAlong(spec, spec.length);
  const nearCentre = iso(end.x, end.y, end.z, view);
  const direction = { x: nearCentre.x - farCentre.x, y: nearCentre.y - farCentre.y };
  let high = 0;
  let low = 0;
  let highest = -Infinity;
  let lowest = Infinity;
  far.forEach((point, index) => {
    const cross = (point.x - farCentre.x) * direction.y - (point.y - farCentre.y) * direction.x;
    if (cross > highest) {
      highest = cross;
      high = index;
    }
    if (cross < lowest) {
      lowest = cross;
      low = index;
    }
  });
  return {
    farCap: toPoints(far),
    body: toPoints([far[high], near[high], near[low], far[low]]),
    nearCap: toPoints(near),
  };
}

/** The box a cylinder fits in, for depth sorting and anchoring. */
export function cylinderBounds(spec: IsoCylinderSpec): IsoBox {
  const axis = spec.axis ?? 'z';
  const r = spec.radius;
  if (axis === 'x') return { x: spec.x, y: spec.y - r, z: spec.z - r, w: spec.length, d: 2 * r, h: 2 * r };
  if (axis === 'y') return { x: spec.x - r, y: spec.y, z: spec.z - r, w: 2 * r, d: spec.length, h: 2 * r };
  return { x: spec.x - r, y: spec.y - r, z: spec.z, w: 2 * r, d: 2 * r, h: spec.length };
}

/** The smallest box that holds all the given boxes. */
export function unionBox(boxes: readonly IsoBox[]): IsoBox {
  if (boxes.length === 0) return { x: 0, y: 0, z: 0, w: 0, d: 0, h: 0 };
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  const z = Math.min(...boxes.map((box) => box.z));
  return {
    x,
    y,
    z,
    w: Math.max(...boxes.map((box) => box.x + box.w)) - x,
    d: Math.max(...boxes.map((box) => box.y + box.d)) - y,
    h: Math.max(...boxes.map((box) => box.z + box.h)) - z,
  };
}

function separatedBehind(a: IsoBox, b: IsoBox): boolean {
  return a.x + a.w <= b.x + EPSILON || a.y + a.d <= b.y + EPSILON || a.z + a.h <= b.z + EPSILON;
}

/**
 * Whether `a` has to be painted before `b`. True when a plane separates them with `a` on the far
 * side and no plane says the opposite — when both hold the boxes cannot overlap on screen, so
 * neither has to come first.
 */
export function mustDrawBefore(a: IsoBox, b: IsoBox): boolean {
  return separatedBehind(a, b) && !separatedBehind(b, a);
}

function depth(box: IsoBox): number {
  return box.x + box.w / 2 + box.y + box.d / 2 + box.z + box.h / 2;
}

/**
 * Painter's order for boxes that do not intersect: farthest first, so nearer boxes cover the
 * ones behind them. Boxes with no constraint between them keep a stable far-to-near order.
 */
export function sortBackToFront<T extends IsoBox>(boxes: readonly T[]): T[] {
  const remaining = [...boxes].sort((a, b) => depth(a) - depth(b));
  const ordered: T[] = [];
  while (remaining.length > 0) {
    const index = remaining.findIndex((candidate) => !remaining.some((other) => other !== candidate && mustDrawBefore(other, candidate)));
    ordered.push(...remaining.splice(index === -1 ? 0 : index, 1));
  }
  return ordered;
}

/** Position of a screen point inside a drawing of the given size, as 0–1 fractions. */
export function toFractions(point: IsoPoint, width: number, height: number): IsoPoint {
  return { x: width > 0 ? point.x / width : 0, y: height > 0 ? point.y / height : 0 };
}

export type CalloutPlacement = { side: 'left' | 'right'; vertical: 'above' | 'below' };

/** Which way a callout opens from its anchor so it stays inside the drawing. */
export function calloutPlacement(anchor: IsoPoint): CalloutPlacement {
  return { side: anchor.x > 0.56 ? 'left' : 'right', vertical: anchor.y < 0.42 ? 'below' : 'above' };
}
