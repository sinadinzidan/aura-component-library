import type { Vec3 } from '../cameraTargets';
import { pointAlong, polylineLength } from '../pipeGeometry';

/** Position and direction of a point a fraction (0–1) of the way along a route; `null` for a route without length. */
export function pointOnRoute(route: readonly Vec3[], at: number): { position: Vec3; direction: Vec3 } | null {
  return pointAlong(route, polylineLength(route) * Math.min(1, Math.max(0, at)));
}
