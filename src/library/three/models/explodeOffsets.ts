import { addVec3, normalizeVec3, scaleVec3, unionBounds } from '../cameraTargets';
import type { Bounds, Vec3 } from '../cameraTargets';

/** How one part travels when its machine is exploded. */
export type ExplodeSpec = {
  /** Direction of travel. Any length; it is normalised. */
  direction: Vec3;
  /** Distance travelled at full explosion, in scene units. */
  distance: number;
  /** Fraction of the explode range at which the part starts to move, so parts leave in sequence. */
  start?: number;
};

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

/** Progress (0–1) of a part that starts moving at `start`, for an explode amount of 0–1. */
export function explodeProgress(amount: number, start = 0): number {
  const from = clampUnit(start);
  if (from >= 1) return amount >= 1 ? 1 : 0;
  return clampUnit((clampUnit(amount) - from) / (1 - from));
}

/** Where a part sits relative to its assembled position, for an explode amount of 0–1. */
export function explodeOffset(spec: ExplodeSpec, amount: number): Vec3 {
  const travelled = spec.distance * explodeProgress(amount, spec.start);
  if (travelled === 0 || (spec.direction[0] === 0 && spec.direction[1] === 0 && spec.direction[2] === 0)) return [0, 0, 0];
  const [x, y, z] = scaleVec3(normalizeVec3(spec.direction), travelled);
  return [x + 0, y + 0, z + 0];
}

/** The offset of every part of a machine, keyed like the specs. */
export function explodeOffsets<K extends string>(specs: Readonly<Record<K, ExplodeSpec>>, amount: number): Record<K, Vec3> {
  const offsets: Partial<Record<K, Vec3>> = {};
  for (const key in specs) offsets[key] = explodeOffset(specs[key], amount);
  if (!hasAll(offsets, specs)) throw new Error('Every spec yields an offset.');
  return offsets;
}

function hasAll<K extends string>(value: Partial<Record<K, Vec3>>, specs: Readonly<Record<K, ExplodeSpec>>): value is Record<K, Vec3> {
  return Object.keys(specs).every((key) => key in value);
}

/** The box around every part at an explode amount, for framing the camera. `null` without parts. */
export function explodedBounds<K extends string>(
  bounds: Readonly<Record<K, Bounds>>,
  specs: Readonly<Record<K, ExplodeSpec>>,
  amount: number
): Bounds | null {
  const boxes: Bounds[] = [];
  for (const key in bounds) {
    const offset = explodeOffset(specs[key], amount);
    boxes.push({ min: addVec3(bounds[key].min, offset), max: addVec3(bounds[key].max, offset) });
  }
  return unionBounds(boxes);
}
