import type { Vec3 } from '../cameraTargets';

export type LazyWaveOptions = {
  /** How far the sag bend drops below the straight descent, as a fraction of the water depth. */
  sag?: number;
  /** How far the buoyancy section lifts the riser, as a fraction of the water depth. */
  hump?: number;
  /** Segments in the result; it has one more point. */
  segments?: number;
};

const bell = (u: number, centre: number, width: number): number => Math.exp(-(((u - centre) / width) ** 2));

/** Height of a lazy-wave riser `u` (0 at the vessel, 1 at the seabed) of the way along, as a fraction from 0 (top) to 1 (touchdown) before shaping. */
function descent(u: number): number {
  return 1 - (1 - u) ** 2.2;
}

/**
 * The path of a flexible riser in a lazy-wave configuration, from the hang-off on the vessel to
 * the touchdown on the seabed: a steep descent, a sag bend, a hump where buoyancy modules lift the
 * line (the hog bend), and a gentle run down to the seabed. The wave decouples vessel motion from
 * the touchdown point. Ends land exactly on the two given points.
 */
export function lazyWavePoints(top: Vec3, touchdown: Vec3, options: LazyWaveOptions = {}): Vec3[] {
  const { sag = 0.1, hump = 0.2, segments = 24 } = options;
  const count = Math.max(2, Math.floor(segments));
  const depth = top[1] - touchdown[1];
  const points: Vec3[] = [];
  for (let index = 0; index <= count; index += 1) {
    const u = index / count;
    const pinned = Math.sin(Math.PI * u);
    const shape = hump * bell(u, 0.72, 0.13) - sag * bell(u, 0.44, 0.14);
    const y = top[1] - depth * descent(u) + depth * shape * pinned;
    points.push([top[0] + (touchdown[0] - top[0]) * u, y, top[2] + (touchdown[2] - top[2]) * u]);
  }
  return points;
}

/** Indices of the interior points that are lower than both neighbours (sag bends) and higher than both (hog bends). */
export function bendIndices(points: readonly Vec3[]): { sag: number[]; hog: number[] } {
  const sag: number[] = [];
  const hog: number[] = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1][1];
    const here = points[index][1];
    const after = points[index + 1][1];
    if (here < before && here < after) sag.push(index);
    if (here > before && here > after) hog.push(index);
  }
  return { sag, hog };
}

const catenaryRise = (a: number, span: number): number => a * (Math.cosh(span / a) - 1);

/**
 * The catenary parameter `a` of a chain that leaves its anchor horizontally and climbs `rise` over
 * a horizontal `span`: y = a (cosh(x / a) − 1). Solved by bisection; a larger `a` is a flatter line.
 */
export function catenaryParameter(span: number, rise: number): number {
  if (span <= 0) return 0;
  if (rise <= 0) return Number.POSITIVE_INFINITY;
  let low = span / 40;
  if (catenaryRise(low, span) < rise) return low;
  let high = Math.max(span, (span * span) / (2 * rise));
  while (catenaryRise(high, span) > rise) high *= 2;
  for (let step = 0; step < 60; step += 1) {
    const middle = (low + high) / 2;
    if (catenaryRise(middle, span) > rise) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

/**
 * A mooring line as a true catenary from its anchor on the seabed to the fairlead on the vessel:
 * it lies flat at the anchor and steepens towards the top. Points run anchor first.
 */
export function catenaryPoints(anchor: Vec3, fairlead: Vec3, segments = 20): Vec3[] {
  const count = Math.max(1, Math.floor(segments));
  const dx = fairlead[0] - anchor[0];
  const dz = fairlead[2] - anchor[2];
  const span = Math.hypot(dx, dz);
  const rise = fairlead[1] - anchor[1];
  const a = catenaryParameter(span, rise);
  const points: Vec3[] = [];
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const lift = index === count ? rise : span === 0 || !Number.isFinite(a) || a === 0 ? rise * t : catenaryRise(a, span * t);
    points.push([anchor[0] + dx * t, anchor[1] + lift, anchor[2] + dz * t]);
  }
  return points;
}
