import type { Route } from './routeSpline';

/** A place where the ground drops away under the line: a river, a road cutting, a ravine. */
export type CorridorDip = {
  /** Where along the east axis the dip is centred. */
  x: number;
  /** Width of the dip along the line. */
  width: number;
  depth: number;
};

export type CorridorTerrainOptions = {
  /** How far below the line's centre the graded right-of-way lies. */
  clearance?: number;
  /** Half the width of the graded strip beside the line, which stays level. */
  shoulder?: number;
  /** Height of the hills beside the strip. */
  relief?: number;
  /** Size of the hills. */
  wavelength?: number;
  dips?: readonly CorridorDip[];
};

/**
 * Where a route that runs steadily eastwards is at a given x: its height and its z. Outside the
 * route the nearest end is used. The route must not double back in x.
 */
export function routeAtX(route: Route, x: number): { y: number; z: number } {
  const samples = route.samples;
  if (samples.length === 0) return { y: 0, z: 0 };
  if (x <= samples[0].position[0]) return { y: samples[0].position[1], z: samples[0].position[2] };
  const last = samples[samples.length - 1];
  if (x >= last.position[0]) return { y: last.position[1], z: last.position[2] };
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (samples[middle].position[0] <= x) low = middle;
    else high = middle;
  }
  const from = samples[low].position;
  const to = samples[high].position;
  const span = to[0] - from[0];
  const t = span === 0 ? 0 : (x - from[0]) / span;
  return { y: from[1] + (to[1] - from[1]) * t, z: from[2] + (to[2] - from[2]) * t };
}

/**
 * Ground level for a pipeline corridor: a level strip directly under the line that follows its
 * elevation, hills that grow with distance from it, and dips where the line spans a crossing.
 */
export function corridorHeight(route: Route, x: number, z: number, options: CorridorTerrainOptions = {}): number {
  const { clearance = 0.6, shoulder = 7, relief = 5, wavelength = 46, dips = [] } = options;
  const line = routeAtX(route, x);
  const aside = Math.max(0, Math.abs(z - line.z) - shoulder);
  const ramp = Math.min(1, aside / (shoulder * 2.5));
  const k = (2 * Math.PI) / Math.max(wavelength, 1e-6);
  const hills = (Math.sin(x * k + z * k * 0.6) * 0.6 + Math.cos(x * k * 0.37 - z * k * 1.3) * 0.4 + 1) / 2;
  let ground = line.y - clearance + relief * ramp * ramp * hills;
  for (const dip of dips) {
    const reach = Math.abs(x - dip.x) / Math.max(dip.width / 2, 1e-6);
    if (reach < 1) ground -= dip.depth * Math.cos((reach * Math.PI) / 2) ** 2;
  }
  return ground;
}
