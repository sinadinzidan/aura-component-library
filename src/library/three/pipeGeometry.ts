import { lengthVec3, lerpVec3, normalizeVec3 } from './cameraTargets';
import type { Vec3 } from './cameraTargets';

export type Quaternion = readonly [number, number, number, number];

/** Placement of a cylinder (whose own axis is y) so that it spans two points. */
export type SegmentTransform = { center: Vec3; length: number; quaternion: Quaternion };

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** The rotation that turns the y axis onto a direction. */
export function quaternionFromY(direction: Vec3): Quaternion {
  const [x, y, z] = normalizeVec3(direction);
  if (y < -0.999999) return [1, 0, 0, 0];
  const w = 1 + y;
  const length = Math.hypot(z, -x, w);
  return [z / length, 0, -x / length, w / length];
}

export function segmentTransform(from: Vec3, to: Vec3): SegmentTransform {
  const delta = subtract(to, from);
  return { center: lerpVec3(from, to, 0.5), length: lengthVec3(delta), quaternion: quaternionFromY(delta) };
}

/** Total length of a route through its points. */
export function polylineLength(points: readonly Vec3[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) total += lengthVec3(subtract(points[index], points[index - 1]));
  return total;
}

/** The point a distance along a route, and the direction of travel there. Distances are clamped to the route. */
export function pointAlong(points: readonly Vec3[], distance: number): { position: Vec3; direction: Vec3 } | null {
  if (points.length < 2) return null;
  let remaining = Math.max(0, distance);
  for (let index = 1; index < points.length; index += 1) {
    const delta = subtract(points[index], points[index - 1]);
    const length = lengthVec3(delta);
    if (length === 0) continue;
    if (remaining <= length || index === points.length - 1) {
      const t = Math.min(1, remaining / length);
      return { position: lerpVec3(points[index - 1], points[index], t), direction: normalizeVec3(delta) };
    }
    remaining -= length;
  }
  return null;
}

/**
 * Distances along a route for evenly spaced flow chevrons. `offset` slides them forward and wraps,
 * so advancing it over time makes the chevrons travel in the flow direction.
 */
export function chevronDistances(total: number, spacing: number, offset = 0): number[] {
  if (total <= 0 || spacing <= 0) return [];
  const count = Math.floor(total / spacing);
  const shift = ((offset % spacing) + spacing) % spacing;
  return Array.from({ length: count }, (_, index) => index * spacing + shift + spacing / 2).filter((distance) => distance < total);
}
