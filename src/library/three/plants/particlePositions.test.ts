import { normalizeRate, particleCount, particlePositions, particleSpeed } from './particlePositions';

const STRAIGHT = [
  [0, 1, 0],
  [36, 1, 0],
] as const;

const BENT = [
  [0, 1, 0],
  [10, 1, 0],
  [10, 1, 10],
] as const;

const OPTIONS = { minSpeed: 1, maxSpeed: 9, minSpacing: 2, maxSpacing: 9, maxCount: 40 };

describe(normalizeRate.name, () => {
  it('expresses a flow as a share of the reference', () => {
    expect(normalizeRate(45, 180)).toBe(0.25);
  });

  it('clamps to 0–1 and survives a zero reference', () => {
    expect(normalizeRate(300, 180)).toBe(1);
    expect(normalizeRate(-5, 180)).toBe(0);
    expect(normalizeRate(10, 0)).toBe(0);
    expect(normalizeRate(Number.NaN, 180)).toBe(0);
  });
});

describe(particleSpeed.name, () => {
  it('is zero when nothing flows', () => {
    expect(particleSpeed(0, OPTIONS)).toBe(0);
  });

  it('rises linearly with the rate up to the maximum', () => {
    expect(particleSpeed(0.5, OPTIONS)).toBe(5);
    expect(particleSpeed(1, OPTIONS)).toBe(9);
    expect(particleSpeed(4, OPTIONS)).toBe(9);
  });
});

describe(particleCount.name, () => {
  it('is zero when nothing flows or the route has no length', () => {
    expect(particleCount(36, 0, OPTIONS)).toBe(0);
    expect(particleCount(0, 1, OPTIONS)).toBe(0);
  });

  it('packs particles at the minimum spacing at full rate', () => {
    expect(particleCount(36, 1, OPTIONS)).toBe(18);
  });

  it('is denser for a higher rate', () => {
    expect(particleCount(36, 0.8, OPTIONS)).toBeGreaterThan(particleCount(36, 0.2, OPTIONS));
  });

  it('keeps at least one particle on a short line that flows', () => {
    expect(particleCount(1, 0.01, OPTIONS)).toBe(1);
  });

  it('never exceeds the cap', () => {
    expect(particleCount(1000, 1, OPTIONS)).toBe(40);
  });
});

describe(particlePositions.name, () => {
  it('returns nothing for a line without flow', () => {
    expect(particlePositions(STRAIGHT, 3, 0, OPTIONS)).toEqual([]);
  });

  it('returns nothing for a route of one point', () => {
    expect(particlePositions([[0, 0, 0]], 3, 1, OPTIONS)).toEqual([]);
  });

  it('spaces particles evenly along the route at time zero', () => {
    const xs = particlePositions(STRAIGHT, 0, 1, OPTIONS).map((particle) => particle.position[0]);

    expect(xs).toHaveLength(18);
    expect(xs[0]).toBe(0);
    expect(xs[1] - xs[0]).toBeCloseTo(2);
    expect(xs[17]).toBeCloseTo(34);
  });

  it('moves particles in the flow direction over time', () => {
    const before = particlePositions(STRAIGHT, 0, 1, OPTIONS)[0].position[0];
    const after = particlePositions(STRAIGHT, 0.1, 1, OPTIONS)[0].position[0];

    expect(after - before).toBeCloseTo(0.9);
  });

  it('moves a faster stream further in the same time', () => {
    const slow = particlePositions(STRAIGHT, 0.2, 0.25, OPTIONS)[0].position[0];
    const fast = particlePositions(STRAIGHT, 0.2, 1, OPTIONS)[0].position[0];

    expect(fast).toBeGreaterThan(slow);
  });

  it('wraps seamlessly: after one spacing the pattern repeats', () => {
    const spacing = 2;
    const period = spacing / particleSpeed(1, OPTIONS);
    const start = particlePositions(STRAIGHT, 0, 1, OPTIONS).map((particle) => particle.position[0]);
    const later = particlePositions(STRAIGHT, period, 1, OPTIONS).map((particle) => particle.position[0]);

    later.forEach((x, index) => expect(x).toBeCloseTo(start[index]));
  });

  it('keeps every particle on the route', () => {
    for (const time of [0, 0.37, 1.9, 12.4]) {
      for (const particle of particlePositions(BENT, time, 0.6, OPTIONS)) {
        const [x, y, z] = particle.position;
        const onFirstLeg = z === 0 && x >= 0 && x <= 10;
        const onSecondLeg = Math.abs(x - 10) < 1e-9 && z >= 0 && z <= 10;
        expect(y).toBe(1);
        expect(onFirstLeg || onSecondLeg).toBe(true);
      }
    }
  });

  it('reports the direction of travel on each leg', () => {
    const particles = particlePositions(BENT, 0, 1, OPTIONS);

    expect(particles[0].direction).toEqual([1, 0, 0]);
    expect(particles[particles.length - 1].direction).toEqual([0, 0, 1]);
  });

  it('is deterministic and tolerates negative or missing time', () => {
    expect(particlePositions(BENT, 4.2, 0.5, OPTIONS)).toEqual(particlePositions(BENT, 4.2, 0.5, OPTIONS));
    expect(particlePositions(STRAIGHT, -0.1, 1, OPTIONS)[0].position[0]).toBeCloseTo(1.1);
    expect(particlePositions(STRAIGHT, Number.NaN, 1, OPTIONS)[0].position[0]).toBe(0);
  });

  it('works with the default options', () => {
    expect(particlePositions(STRAIGHT, 1, 1).length).toBeGreaterThan(0);
  });
});
