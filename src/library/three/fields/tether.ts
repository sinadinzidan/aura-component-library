import type { Vec3 } from '../cameraTargets';

/**
 * Points of a slack cable between two ends: a straight line that sags by up to `sag` in the
 * middle, the way a tether hangs in water. Includes both ends.
 */
export function tetherPoints(from: Vec3, to: Vec3, sag = 3, count = 14): Vec3[] {
  const steps = Math.max(2, Math.floor(count));
  return Array.from({ length: steps }, (_, index) => {
    const t = index / (steps - 1);
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag * Math.sin(Math.PI * t), from[2] + (to[2] - from[2]) * t] as const;
  });
}

/** Moves `current` a fraction of the way to `goal`, and reports whether it has arrived. */
export function approach(current: Vec3, goal: Vec3, fraction: number, tolerance = 0.02): { position: Vec3; arrived: boolean } {
  const f = Math.min(1, Math.max(0, fraction));
  const position: Vec3 = [current[0] + (goal[0] - current[0]) * f, current[1] + (goal[1] - current[1]) * f, current[2] + (goal[2] - current[2]) * f];
  const arrived = Math.hypot(goal[0] - position[0], goal[1] - position[1], goal[2] - position[2]) <= tolerance;
  return { position: arrived ? goal : position, arrived };
}
