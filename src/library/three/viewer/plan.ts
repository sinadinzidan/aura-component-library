import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';

/** Plan-view helpers for a mini-map: x east is right, z south is down. */
export type PlanBox = { x: number; y: number; width: number; height: number };

export type PlanSpace = { bounds: Bounds; width: number; height: number; padding: number };

/** The scale (pixels per metre) that fits the bounds in the map. */
export function planScale(space: PlanSpace): number {
  const spanX = space.bounds.max[0] - space.bounds.min[0];
  const spanZ = space.bounds.max[2] - space.bounds.min[2];
  return Math.min((space.width - 2 * space.padding) / Math.max(spanX, 1e-6), (space.height - 2 * space.padding) / Math.max(spanZ, 1e-6));
}

/** A world point in map pixels, centred in the map. */
export function planPoint(point: Vec3, space: PlanSpace): { x: number; y: number } {
  const scale = planScale(space);
  const centreX = (space.bounds.min[0] + space.bounds.max[0]) / 2;
  const centreZ = (space.bounds.min[2] + space.bounds.max[2]) / 2;
  return { x: space.width / 2 + (point[0] - centreX) * scale, y: space.height / 2 + (point[2] - centreZ) * scale };
}

/** A world box as a map rectangle. */
export function planBox(bounds: Bounds, space: PlanSpace): PlanBox {
  const a = planPoint(bounds.min, space);
  const b = planPoint(bounds.max, space);
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

/** Compass heading of the camera's line of sight in the plan, in degrees clockwise from the top of the map. */
export function planHeading(pose: CameraTarget): number {
  const dx = pose.lookAt[0] - pose.position[0];
  const dz = pose.lookAt[2] - pose.position[2];
  return ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
}

/** The view cone as an SVG path: a wedge from the camera along its heading. */
export function viewConePath(pose: CameraTarget, space: PlanSpace, fovDegrees = 50, reach = 26): string {
  const origin = planPoint(pose.position, space);
  const heading = (planHeading(pose) * Math.PI) / 180;
  const half = (fovDegrees * Math.PI) / 360;
  const corner = (angle: number) => `${(origin.x + Math.sin(angle) * reach).toFixed(1)} ${(origin.y - Math.cos(angle) * reach).toFixed(1)}`;
  return `M ${origin.x.toFixed(1)} ${origin.y.toFixed(1)} L ${corner(heading - half)} L ${corner(heading + half)} Z`;
}
