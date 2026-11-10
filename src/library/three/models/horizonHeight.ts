/** A stratigraphic horizon: the top of a formation, as a gently undulating surface. Depths in metres TVD. */
export type Horizon = {
  id: string;
  /** Name of the surface, e.g. "Top Garn". */
  name: string;
  /** The formation below the surface, e.g. "Garn Fm". */
  formation: string;
  /** Mean depth of the surface. */
  depth: number;
  /** Half the height of its undulation. */
  relief: number;
  /** Phase of the undulation, so horizons do not run parallel. */
  seed: number;
  /** Depth gained per metre towards the east: a regional dip. */
  dipEast?: number;
};

const WAVELENGTH = 1400;

/** Depth of a horizon at a map position. Deterministic: the same inputs always give the same surface. */
export function horizonDepthAt(horizon: Horizon, east: number, north: number): number {
  const a = Math.sin(east / WAVELENGTH + horizon.seed) * Math.cos(north / (WAVELENGTH * 1.3) + horizon.seed * 1.7);
  const b = Math.sin((east + north) / (WAVELENGTH * 0.6) + horizon.seed * 0.5);
  return horizon.depth + horizon.relief * (a * 0.65 + b * 0.35) + (horizon.dipEast ?? 0) * east;
}

/**
 * The formation a point lies in: the one below the deepest horizon above the point. Returns
 * `null` above the first horizon (the overburden).
 */
export function formationAt(horizons: readonly Horizon[], tvd: number, east: number, north: number): Horizon | null {
  let current: { horizon: Horizon; top: number } | null = null;
  for (const horizon of horizons) {
    const top = horizonDepthAt(horizon, east, north);
    if (top <= tvd && (current === null || top > current.top)) current = { horizon, top };
  }
  return current ? current.horizon : null;
}
