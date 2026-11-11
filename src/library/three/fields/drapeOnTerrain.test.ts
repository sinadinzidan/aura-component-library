import { drapeOnTerrain, planLength, resamplePlan, snakePlan } from './drapeOnTerrain';
import type { PlanPoint } from './drapeOnTerrain';

const L_SHAPE: PlanPoint[] = [
  [0, 0],
  [10, 0],
  [10, 6],
];

describe(planLength.name, () => {
  it('adds up the legs', () => {
    expect(planLength(L_SHAPE)).toBe(16);
  });

  it('is zero for fewer than two points', () => {
    expect(planLength([[3, 4]])).toBe(0);
  });
});

describe(resamplePlan.name, () => {
  it('keeps the ends and the corners', () => {
    const result = resamplePlan(L_SHAPE, 4);

    expect(result[0]).toEqual([0, 0]);
    expect(result).toContainEqual([10, 0]);
    expect(result[result.length - 1]).toEqual([10, 6]);
  });

  it('leaves no gap longer than the spacing', () => {
    const result = resamplePlan(L_SHAPE, 4);

    for (let index = 1; index < result.length; index += 1) {
      expect(Math.hypot(result[index][0] - result[index - 1][0], result[index][1] - result[index - 1][1])).toBeLessThanOrEqual(4 + 1e-9);
    }
  });

  it('does not change the length of the route', () => {
    expect(planLength(resamplePlan(L_SHAPE, 1.5))).toBeCloseTo(16, 9);
  });

  it('returns nothing for an empty plan and survives a zero spacing', () => {
    expect(resamplePlan([], 4)).toEqual([]);
    expect(resamplePlan([[0, 0], [0.002, 0]], 0).length).toBeGreaterThanOrEqual(2);
  });
});

describe(snakePlan.name, () => {
  it('starts and ends exactly on its tie-in points', () => {
    const result = snakePlan([0, 0], [40, 10], { amplitude: 4 });

    expect(result[0]).toEqual([0, 0]);
    expect(result[result.length - 1]).toEqual([40, 10]);
  });

  it('never strays further than the amplitude from the straight line', () => {
    const result = snakePlan([0, 0], [40, 0], { amplitude: 4, waves: 2, steps: 40 });

    expect(Math.max(...result.map((point) => Math.abs(point[1])))).toBeLessThanOrEqual(4);
    expect(Math.max(...result.map((point) => Math.abs(point[1])))).toBeGreaterThan(2);
  });

  it('bends to both sides', () => {
    const result = snakePlan([0, 0], [40, 0], { amplitude: 4, waves: 1, steps: 40 });

    expect(result.some((point) => point[1] > 1)).toBe(true);
    expect(result.some((point) => point[1] < -1)).toBe(true);
  });

  it('is longer than the straight line', () => {
    expect(planLength(snakePlan([0, 0], [40, 0], { amplitude: 5 }))).toBeGreaterThan(40);
  });

  it('returns the two points when they coincide', () => {
    expect(snakePlan([2, 2], [2, 2])).toEqual([
      [2, 2],
      [2, 2],
    ]);
  });
});

describe(drapeOnTerrain.name, () => {
  it('puts every point on the ground plus the clearance', () => {
    const height = (x: number, z: number) => x * 0.1 - z * 0.2;
    const result = drapeOnTerrain(L_SHAPE, height, { spacing: 2, clearance: 0.3 });

    for (const [x, y, z] of result) expect(y).toBeCloseTo(height(x, z) + 0.3, 9);
  });

  it('follows a dip between two far-apart waypoints', () => {
    const valley = (x: number) => -Math.exp(-((x - 20) ** 2) / 8) * 5;
    const result = drapeOnTerrain([[0, 0], [40, 0]], valley, { spacing: 2, clearance: 0 });

    expect(Math.min(...result.map((point) => point[1]))).toBeLessThan(-4.5);
  });

  it('keeps the plan position of the ends', () => {
    const result = drapeOnTerrain(L_SHAPE, () => 7);

    expect(result[0]).toEqual([0, 7.2, 0]);
    expect(result[result.length - 1]).toEqual([10, 7.2, 6]);
  });
});
