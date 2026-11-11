import { lengthVec3, lerpVec3, normalizeVec3 } from '../cameraTargets';
import type { CameraTarget, Vec3 } from '../cameraTargets';

/** One point of a sampled route: its distance from the start and where it is. */
export type RouteSample = { s: number; position: Vec3 };

/** A smooth line through waypoints, sampled densely enough to be looked up by distance. */
export type Route = { length: number; samples: readonly RouteSample[] };

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** A point on the uniform Catmull-Rom curve between `p1` (t = 0) and `p2` (t = 1). */
export function catmullRom(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const axis = (index: 0 | 1 | 2): number =>
    0.5 *
    (2 * p1[index] +
      (-p0[index] + p2[index]) * t +
      (2 * p0[index] - 5 * p1[index] + 4 * p2[index] - p3[index]) * t2 +
      (-p0[index] + 3 * p1[index] - 3 * p2[index] + p3[index]) * t3);
  return [axis(0), axis(1), axis(2)];
}

/**
 * Builds a route through the waypoints: a Catmull-Rom spline that passes through every one,
 * sampled `perSegment` times between neighbours with the running distance stored on each sample.
 */
export function buildRoute(waypoints: readonly Vec3[], perSegment = 12): Route {
  if (waypoints.length === 0) return { length: 0, samples: [] };
  if (waypoints.length === 1) return { length: 0, samples: [{ s: 0, position: waypoints[0] }] };
  const steps = Math.max(1, Math.floor(perSegment));
  const samples: RouteSample[] = [{ s: 0, position: waypoints[0] }];
  let travelled = 0;
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const p0 = waypoints[Math.max(0, index - 1)];
    const p1 = waypoints[index];
    const p2 = waypoints[index + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, index + 2)];
    for (let step = 1; step <= steps; step += 1) {
      const position = step === steps ? p2 : catmullRom(p0, p1, p2, p3, step / steps);
      travelled += lengthVec3(subtract(position, samples[samples.length - 1].position));
      samples.push({ s: travelled, position });
    }
  }
  return { length: travelled, samples };
}

/** Keeps a distance on the route. */
export function clampDistance(route: Route, s: number): number {
  return Math.min(route.length, Math.max(0, Number.isFinite(s) ? s : 0));
}

/** Index of the last sample at or before distance `s`. */
function sampleIndex(route: Route, s: number): number {
  let low = 0;
  let high = route.samples.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (route.samples[middle].s <= s) low = middle;
    else high = middle;
  }
  return low;
}

/** Where the route is at distance `s`, and which way it runs there. Distances are clamped to the route. */
export function sampleRoute(route: Route, s: number): { position: Vec3; tangent: Vec3 } {
  if (route.samples.length === 0) return { position: [0, 0, 0], tangent: [1, 0, 0] };
  if (route.samples.length === 1) return { position: route.samples[0].position, tangent: [1, 0, 0] };
  const distance = clampDistance(route, s);
  const index = Math.min(sampleIndex(route, distance), route.samples.length - 2);
  const from = route.samples[index];
  const to = route.samples[index + 1];
  const span = to.s - from.s;
  const t = span === 0 ? 0 : (distance - from.s) / span;
  const delta = subtract(to.position, from.position);
  return { position: lerpVec3(from.position, to.position, t), tangent: lengthVec3(delta) === 0 ? [1, 0, 0] : normalizeVec3(delta) };
}

export type RailOptions = {
  /** How high above the line the camera rides. */
  height?: number;
  /** How far behind the distance in question the camera sits. */
  back?: number;
  /** How far ahead of it the camera looks. */
  lookAhead?: number;
  /** Sideways offset from the line, to the right of the direction of travel. */
  side?: number;
};

/**
 * The camera pose for travelling along a route: a little behind and above distance `s`, looking
 * at the line some way ahead. At the ends the camera holds on the last stretch instead of
 * leaving the route.
 */
export function railPose(route: Route, s: number, options: RailOptions = {}): CameraTarget {
  const { height = 5, back = 10, lookAhead = 14, side = 0 } = options;
  const distance = clampDistance(route, s);
  const here = sampleRoute(route, distance - back);
  const ahead = sampleRoute(route, distance + lookAhead);
  const overshootBack = Math.max(0, back - distance);
  const overshootAhead = Math.max(0, distance + lookAhead - route.length);
  const right: Vec3 = normalizeVec3([-here.tangent[2], 0, here.tangent[0]]);
  const flat = lengthVec3([here.tangent[0], 0, here.tangent[2]]) === 0;
  return {
    position: [
      here.position[0] - here.tangent[0] * overshootBack + (flat ? 0 : right[0] * side),
      here.position[1] + height,
      here.position[2] - here.tangent[2] * overshootBack + (flat ? 0 : right[2] * side),
    ],
    lookAt: [ahead.position[0] + ahead.tangent[0] * overshootAhead, ahead.position[1], ahead.position[2] + ahead.tangent[2] * overshootAhead],
  };
}

/** The points of the route between two distances, ends included, for drawing one stretch of it. */
export function routeSlice(route: Route, from: number, to: number): Vec3[] {
  const start = clampDistance(route, Math.min(from, to));
  const end = clampDistance(route, Math.max(from, to));
  const inner = route.samples.filter((sample) => sample.s > start && sample.s < end).map((sample) => sample.position);
  return [sampleRoute(route, start).position, ...inner, sampleRoute(route, end).position];
}

/** Converts a chainage in kilometres to a distance along a route that represents `totalKm`. */
export function kpToDistance(route: Route, kp: number, totalKm: number): number {
  return totalKm <= 0 ? 0 : clampDistance(route, (kp / totalKm) * route.length);
}

/** Converts a distance along the route back to a chainage in kilometres. */
export function distanceToKp(route: Route, s: number, totalKm: number): number {
  return route.length <= 0 ? 0 : (clampDistance(route, s) / route.length) * totalKm;
}

/** The station closest to a chainage; `null` when there are none. */
export function nearestStation<T extends { kp: number }>(stations: readonly T[], kp: number): T | null {
  let best: T | null = null;
  for (const station of stations) {
    if (best === null || Math.abs(station.kp - kp) < Math.abs(best.kp - kp)) best = station;
  }
  return best;
}

/**
 * The next station up or down the line from a chainage. A station the camera is standing on
 * (within `tolerance`) is skipped, so repeated presses walk the line. `null` at either end.
 */
export function stationStep<T extends { kp: number }>(stations: readonly T[], kp: number, direction: 1 | -1, tolerance = 0.05): T | null {
  const ordered = [...stations].sort((a, b) => a.kp - b.kp);
  if (direction === 1) return ordered.find((station) => station.kp > kp + tolerance) ?? null;
  return ordered.reverse().find((station) => station.kp < kp - tolerance) ?? null;
}
