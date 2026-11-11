import type { Vec3 } from '../cameraTargets';

import type { HeightFunction } from './terrainHeight';

/** A point on the plan: x east, z south. */
export type PlanPoint = readonly [number, number];

export type DrapeOptions = {
  /** Largest distance between two points of the result, so the line follows every dip. */
  spacing?: number;
  /** How far above the ground the line's centre lies: its radius, or the height of its supports. */
  clearance?: number;
};

/** Length of a route on the plan. */
export function planLength(plan: readonly PlanPoint[]): number {
  let total = 0;
  for (let index = 1; index < plan.length; index += 1) total += Math.hypot(plan[index][0] - plan[index - 1][0], plan[index][1] - plan[index - 1][1]);
  return total;
}

/** The same route with extra points, so no two neighbours are further apart than `spacing`. Corners are kept. */
export function resamplePlan(plan: readonly PlanPoint[], spacing: number): PlanPoint[] {
  if (plan.length === 0) return [];
  const step = Math.max(spacing, 1e-3);
  const result: PlanPoint[] = [plan[0]];
  for (let index = 1; index < plan.length; index += 1) {
    const from = plan[index - 1];
    const to = plan[index];
    const pieces = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / step));
    for (let piece = 1; piece <= pieces; piece += 1) {
      const t = piece / pieces;
      result.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
    }
  }
  return result;
}

export type SnakeOptions = {
  /** Largest sideways excursion from the straight line. */
  amplitude?: number;
  /** Number of full S-bends between the ends. */
  waves?: number;
  /** Points in the result, ends included. */
  steps?: number;
};

/**
 * A route that snakes from one point to another, the way a flowline is laid with slack to take up
 * thermal expansion. The excursion fades to nothing at both ends, so the line still lands on its
 * tie-in points.
 */
export function snakePlan(from: PlanPoint, to: PlanPoint, options: SnakeOptions = {}): PlanPoint[] {
  const { amplitude = 3, waves = 1.5, steps = 16 } = options;
  const count = Math.max(2, Math.floor(steps));
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  if (length === 0) return [from, to];
  const normal: PlanPoint = [-dz / length, dx / length];
  const result: PlanPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const offset = index === 0 || index === count - 1 ? 0 : amplitude * Math.sin(t * Math.PI * 2 * waves) * Math.sin(t * Math.PI);
    result.push([from[0] + dx * t + normal[0] * offset, from[1] + dz * t + normal[1] * offset]);
  }
  return result;
}

/**
 * Lays a route on the ground: resamples the plan so the line follows the terrain, then lifts every
 * point to the ground level plus `clearance`. Use the result as the path of a tube.
 */
export function drapeOnTerrain(plan: readonly PlanPoint[], height: HeightFunction, options: DrapeOptions = {}): Vec3[] {
  const { spacing = 4, clearance = 0.2 } = options;
  return resamplePlan(plan, spacing).map(([x, z]) => [x, height(x, z) + clearance, z] as const);
}
