import { formationAt, horizonDepthAt } from './horizonHeight';
import type { Horizon } from './horizonHeight';

const TOP: Horizon = { id: 'kai', name: 'Top Kai', formation: 'Kai Fm', depth: 900, relief: 40, seed: 1 };
const DEEP: Horizon = { id: 'garn', name: 'Top Garn', formation: 'Garn Fm', depth: 2300, relief: 60, seed: 2.4, dipEast: 0.02 };

describe(horizonDepthAt.name, () => {
  it('is deterministic', () => {
    expect(horizonDepthAt(TOP, 310, -820)).toBe(horizonDepthAt(TOP, 310, -820));
  });

  it('stays within the relief around the mean depth', () => {
    for (let east = -3000; east <= 3000; east += 500) {
      for (let north = -3000; north <= 3000; north += 500) {
        const depth = horizonDepthAt(TOP, east, north);

        expect(depth).toBeGreaterThanOrEqual(TOP.depth - TOP.relief);
        expect(depth).toBeLessThanOrEqual(TOP.depth + TOP.relief);
      }
    }
  });

  it('undulates: it is not flat', () => {
    expect(horizonDepthAt(TOP, 0, 0)).not.toBeCloseTo(horizonDepthAt(TOP, 1500, 900), 1);
  });

  it('is flat without relief', () => {
    expect(horizonDepthAt({ ...TOP, relief: 0 }, 1234, -987)).toBe(900);
  });

  it('deepens down dip', () => {
    const flat = { ...DEEP, relief: 0 };

    expect(horizonDepthAt(flat, 1000, 0) - horizonDepthAt(flat, 0, 0)).toBeCloseTo(20);
  });
});

describe(formationAt.name, () => {
  const horizons = [TOP, DEEP];

  it('is null in the overburden above the first horizon', () => {
    expect(formationAt(horizons, 300, 0, 0)).toBeNull();
  });

  it('returns the formation below the deepest horizon above the point', () => {
    expect(formationAt(horizons, 1500, 0, 0)?.formation).toBe('Kai Fm');
    expect(formationAt(horizons, 2600, 0, 0)?.formation).toBe('Garn Fm');
  });

  it('uses the local depth of the surface, not its mean', () => {
    const local = horizonDepthAt(TOP, 800, 400);

    expect(formationAt(horizons, local + 1, 800, 400)?.id).toBe('kai');
    expect(formationAt(horizons, local - 1, 800, 400)).toBeNull();
  });

  it('does not depend on the order of the horizons', () => {
    expect(formationAt([DEEP, TOP], 2600, 0, 0)?.id).toBe('garn');
  });
});
