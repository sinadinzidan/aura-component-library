/** A deterministic, gently rolling surface: the same inputs always give the same ground. */
export type TerrainSpec = {
  /** Largest distance the surface rises or falls from `base`, in scene units. */
  relief: number;
  /** Size of the main undulation, in scene units. */
  wavelength: number;
  /** Picks one landscape out of many. */
  seed: number;
  /** Mean level of the surface. */
  base?: number;
};

/** A function that returns the ground level at a point on the plan. */
export type HeightFunction = (x: number, z: number) => number;

const WEIGHT = 1.85;

/**
 * Ground level at (x, z): three overlapping waves, so the surface never repeats visibly and stays
 * within `relief` of `base`. Pure, so lines draped on the terrain and the mesh always agree.
 */
export function terrainHeight(spec: TerrainSpec, x: number, z: number): number {
  const k = (2 * Math.PI) / Math.max(spec.wavelength, 1e-6);
  const phase = spec.seed * 1.618;
  const swell = Math.sin(x * k + phase) * Math.cos(z * k * 0.8 + phase * 0.7);
  const ripple = Math.sin((x * 0.6 + z * 0.8) * k * 2.1 + phase * 2.3) * 0.35;
  const drift = Math.cos((x * 0.9 - z * 0.45) * k * 0.47 + phase * 0.4) * 0.5;
  return (spec.base ?? 0) + (spec.relief * (swell + ripple + drift)) / WEIGHT;
}

export type TerrainGrid = {
  /** x, y, z triples, row by row from the north-west corner. */
  positions: number[];
  /** Two triangles per cell. */
  indices: number[];
  columns: number;
  rows: number;
};

/**
 * The vertices and triangles of a low-poly terrain: a `size` rectangle centred on `center`, cut
 * into `segments` cells, with every vertex lifted to `height(x, z)`.
 */
export function terrainGrid(
  height: HeightFunction,
  size: readonly [number, number],
  segments: readonly [number, number],
  center: readonly [number, number] = [0, 0]
): TerrainGrid {
  const columns = Math.max(1, Math.floor(segments[0]));
  const rows = Math.max(1, Math.floor(segments[1]));
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const x = center[0] - size[0] / 2 + (column / columns) * size[0];
      const z = center[1] - size[1] / 2 + (row / rows) * size[1];
      positions.push(x, height(x, z), z);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      indices.push(a, c, b, b, c, c + 1);
    }
  }
  return { positions, indices, columns, rows };
}
