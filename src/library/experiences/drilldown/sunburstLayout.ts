/**
 * Pure layout for a sunburst: a partition of the full circle into nested arcs, the radii of each
 * ring, SVG arc paths and the interpolation used to tween from one root to another.
 * Angles are radians, 0 at twelve o'clock, growing clockwise.
 */

export const FULL_CIRCLE = Math.PI * 2;

export type SunburstArc = {
  id: string;
  parentId: string | null;
  /** 0 is the root (the centre disc), 1 the first ring. */
  depth: number;
  start: number;
  end: number;
};

export type PartitionAccessors<T> = {
  id: (node: T) => string;
  children: (node: T) => readonly T[];
  /** Weight of a leaf. Defaults to 1, so every leaf gets the same angle. */
  weight?: (node: T) => number;
  /** Deepest ring to lay out, counted from the root at 0. */
  maxDepth?: number;
};

/**
 * Partitions the circle below `root`: every node gets an angle proportional to the weight of its
 * leaves, children sit inside their parent's angle, and siblings keep their order.
 */
export function partition<T>(root: T, accessors: PartitionAccessors<T>): SunburstArc[] {
  const { id, children, weight = () => 1, maxDepth = Infinity } = accessors;

  const weigh = (node: T): number => {
    const kids = children(node);
    if (kids.length === 0) return Math.max(weight(node), 0);
    return kids.reduce((total, kid) => total + weigh(kid), 0);
  };

  const arcs: SunburstArc[] = [];
  const place = (node: T, parentId: string | null, depth: number, start: number, end: number) => {
    arcs.push({ id: id(node), parentId, depth, start, end });
    if (depth >= maxDepth) return;
    const kids = children(node);
    const weights = kids.map(weigh);
    const total = weights.reduce((sum, value) => sum + value, 0);
    let cursor = start;
    kids.forEach((kid, index) => {
      const share = total > 0 ? (weights[index] ?? 0) / total : 1 / kids.length;
      const span = (end - start) * share;
      place(kid, id(node), depth + 1, cursor, cursor + span);
      cursor += span;
    });
  };

  place(root, null, 0, 0, FULL_CIRCLE);
  return arcs;
}

export type RingOptions = {
  /** Radius of the centre disc. */
  inner: number;
  /** Radius of the outside of the last ring. */
  outer: number;
  /** Number of rings to fit between `inner` and `outer`. */
  rings: number;
  /** Space between rings. */
  gap?: number;
};

/** Inner and outer radius of ring `depth` (1-based; 0 is the centre disc). */
export function ringRadii(depth: number, options: RingOptions): { r0: number; r1: number } {
  const { inner, outer, rings, gap = 0 } = options;
  if (depth <= 0) return { r0: 0, r1: inner };
  const width = (outer - inner) / Math.max(rings, 1);
  return { r0: inner + (depth - 1) * width + gap, r1: inner + depth * width };
}

/** A point on a circle around (cx, cy). */
export function polar(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) };
}

const fixed = (value: number): string => (Math.round(value * 100) / 100).toString();

/** SVG path of an annular sector. A full turn is drawn as two half rings so it does not collapse. */
export function arcPath(cx: number, cy: number, r0: number, r1: number, start: number, end: number): string {
  const span = Math.min(Math.max(end - start, 0), FULL_CIRCLE);
  if (span <= 0 || r1 <= 0) return '';
  if (span >= FULL_CIRCLE - 1e-6) {
    const half = start + Math.PI;
    return `${arcPath(cx, cy, r0, r1, start, half)} ${arcPath(cx, cy, r0, r1, half, start + FULL_CIRCLE - 1e-4)}`;
  }
  const large = span > Math.PI ? 1 : 0;
  const outerStart = polar(cx, cy, r1, start);
  const outerEnd = polar(cx, cy, r1, start + span);
  if (r0 <= 0) {
    return `M ${fixed(cx)} ${fixed(cy)} L ${fixed(outerStart.x)} ${fixed(outerStart.y)} A ${fixed(r1)} ${fixed(r1)} 0 ${large} 1 ${fixed(outerEnd.x)} ${fixed(outerEnd.y)} Z`;
  }
  const innerEnd = polar(cx, cy, r0, start + span);
  const innerStart = polar(cx, cy, r0, start);
  return [
    `M ${fixed(outerStart.x)} ${fixed(outerStart.y)}`,
    `A ${fixed(r1)} ${fixed(r1)} 0 ${large} 1 ${fixed(outerEnd.x)} ${fixed(outerEnd.y)}`,
    `L ${fixed(innerEnd.x)} ${fixed(innerEnd.y)}`,
    `A ${fixed(r0)} ${fixed(r0)} 0 ${large} 0 ${fixed(innerStart.x)} ${fixed(innerStart.y)}`,
    'Z',
  ].join(' ');
}

/** An arc with its radii resolved: what is actually drawn, and what a tween interpolates. */
export type ArcShape = { id: string; depth: number; start: number; end: number; r0: number; r1: number };

/** Resolves ring radii for every arc below the root (the root itself is the centre disc). */
export function shapeArcs(arcs: readonly SunburstArc[], options: Omit<RingOptions, 'rings'> & { rings?: number }): ArcShape[] {
  const deepest = arcs.reduce((max, arc) => Math.max(max, arc.depth), 0);
  const rings = options.rings ?? Math.max(deepest, 1);
  return arcs
    .filter((arc) => arc.depth > 0)
    .map((arc) => ({ id: arc.id, depth: arc.depth, start: arc.start, end: arc.end, ...ringRadii(arc.depth, { ...options, rings }) }));
}

/** Centre of an arc, where its label goes. */
export function arcCentroid(cx: number, cy: number, shape: Pick<ArcShape, 'start' | 'end' | 'r0' | 'r1'>): { x: number; y: number } {
  return polar(cx, cy, (shape.r0 + shape.r1) / 2, (shape.start + shape.end) / 2);
}

/** Length of an arc along the middle of its ring: how much room a label has. */
export function arcLength(shape: Pick<ArcShape, 'start' | 'end' | 'r0' | 'r1'>): number {
  return ((shape.r0 + shape.r1) / 2) * (shape.end - shape.start);
}

/** Ease in and out, 0–1. */
export function easeInOut(progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

const mix = (from: number, to: number, t: number): number => from + (to - from) * t;

/**
 * The arcs at `progress` (0–1) of a tween from one layout to another. Arcs in both are moved;
 * arcs that only exist in the target grow out of the rim of the old chart at their final angle.
 * Arcs that only existed before are dropped.
 */
export function tweenArcs(from: readonly ArcShape[], to: readonly ArcShape[], progress: number): ArcShape[] {
  if (progress >= 1) return [...to];
  const before = new Map(from.map((shape) => [shape.id, shape]));
  const rim = from.reduce((max, shape) => Math.max(max, shape.r1), 0) || to.reduce((max, shape) => Math.max(max, shape.r1), 0);
  return to.map((shape) => {
    const origin = before.get(shape.id) ?? { ...shape, r0: rim, r1: rim };
    return {
      id: shape.id,
      depth: shape.depth,
      start: mix(origin.start, shape.start, progress),
      end: mix(origin.end, shape.end, progress),
      r0: mix(origin.r0, shape.r0, progress),
      r1: mix(origin.r1, shape.r1, progress),
    };
  });
}
