import { terrainGrid, terrainHeight } from './terrainHeight';
import type { TerrainSpec } from './terrainHeight';

const BASE = 1;
const SPEC: TerrainSpec = { relief: 3, wavelength: 60, seed: 4, base: BASE };

describe(terrainHeight.name, () => {
  it('is deterministic', () => {
    expect(terrainHeight(SPEC, 12.5, -40)).toBe(terrainHeight(SPEC, 12.5, -40));
  });

  it('stays within the relief around the base level', () => {
    for (let x = -100; x <= 100; x += 7) {
      for (let z = -100; z <= 100; z += 9) {
        const height = terrainHeight(SPEC, x, z);
        expect(height).toBeGreaterThanOrEqual(BASE - SPEC.relief);
        expect(height).toBeLessThanOrEqual(BASE + SPEC.relief);
      }
    }
  });

  it('undulates: not every point has the same height', () => {
    const heights = [0, 10, 20, 30, 40].map((x) => terrainHeight(SPEC, x, 5));

    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.5);
  });

  it('gives a different landscape for a different seed', () => {
    expect(terrainHeight({ ...SPEC, seed: 5 }, 10, 10)).not.toBeCloseTo(terrainHeight(SPEC, 10, 10), 3);
  });

  it('is flat with zero relief and defaults the base to zero', () => {
    expect(terrainHeight({ relief: 0, wavelength: 50, seed: 1 }, 33, 71)).toBeCloseTo(0, 10);
  });

  it('survives a zero wavelength', () => {
    expect(Number.isFinite(terrainHeight({ relief: 2, wavelength: 0, seed: 1 }, 3, 4))).toBe(true);
  });
});

describe(terrainGrid.name, () => {
  it('makes one vertex per grid corner and two triangles per cell', () => {
    const grid = terrainGrid(() => 0, [40, 20], [4, 2]);

    expect(grid.positions).toHaveLength(5 * 3 * 3);
    expect(grid.indices).toHaveLength(4 * 2 * 6);
  });

  it('spans the rectangle around its centre', () => {
    const grid = terrainGrid(() => 0, [40, 20], [4, 2], [10, -5]);
    const xs = grid.positions.filter((_, index) => index % 3 === 0);
    const zs = grid.positions.filter((_, index) => index % 3 === 2);

    expect([Math.min(...xs), Math.max(...xs)]).toEqual([-10, 30]);
    expect([Math.min(...zs), Math.max(...zs)]).toEqual([-15, 5]);
  });

  it('lifts every vertex to the height function', () => {
    const grid = terrainGrid((x, z) => x + z, [10, 10], [2, 2]);

    for (let index = 0; index < grid.positions.length; index += 3) {
      expect(grid.positions[index + 1]).toBe(grid.positions[index] + grid.positions[index + 2]);
    }
  });

  it('keeps every index inside the vertex list and never fewer than one cell', () => {
    const grid = terrainGrid(() => 0, [10, 10], [0, 0]);

    expect(grid.columns).toBe(1);
    expect(grid.rows).toBe(1);
    expect(Math.max(...grid.indices)).toBe(3);
  });
});
