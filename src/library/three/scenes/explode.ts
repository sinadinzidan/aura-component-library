import { easeInOutCubic, unionBounds } from '../cameraTargets';
import type { Bounds } from '../cameraTargets';

/**
 * Exploded-view maths. A stack of levels (jacket, decks, modules) separates along the vertical
 * axis: level 0 stays where it is and every level above it rises by one more `gap`, scaled by an
 * `amount` from 0 (assembled) to 1 (fully exploded).
 */

/** One level of the stack. `envelope` is the box around everything on it, relative to its own origin. */
export type ExplodeLevel = { id: string; envelope: Bounds };

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** How far level `index` rises at an explode `amount` of 0–1. */
export function explodeOffset(index: number, amount: number, gap: number): number {
  return Math.max(0, index) * gap * clampUnit(amount) + 0;
}

/** The rise of each of `count` levels, bottom first. */
export function explodeOffsets(count: number, amount: number, gap: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => explodeOffset(index, amount, gap));
}

/** A box moved straight up. */
export function liftBounds(bounds: Bounds, lift: number): Bounds {
  return { min: [bounds.min[0], bounds.min[1] + lift, bounds.min[2]], max: [bounds.max[0], bounds.max[1] + lift, bounds.max[2]] };
}

/** World-space box around one level at an explode amount; `null` for an unknown id. */
export function levelBounds(levels: readonly ExplodeLevel[], id: string, amount: number, gap: number): Bounds | null {
  const index = levels.findIndex((level) => level.id === id);
  if (index === -1) return null;
  return liftBounds(levels[index].envelope, explodeOffset(index, amount, gap));
}

/** World-space box around the whole stack at an explode amount; `null` for an empty stack. */
export function stackBounds(levels: readonly ExplodeLevel[], amount: number, gap: number): Bounds | null {
  return unionBounds(levels.map((level, index) => liftBounds(level.envelope, explodeOffset(index, amount, gap))));
}

/** Clear air between two neighbouring levels: the upper one's floor minus the lower one's top. */
export function clearance(levels: readonly ExplodeLevel[], lowerIndex: number, amount: number, gap: number): number {
  const lower = levels[lowerIndex];
  const upper = levels[lowerIndex + 1];
  if (!lower || !upper) return 0;
  const lowerTop = lower.envelope.max[1] + explodeOffset(lowerIndex, amount, gap);
  const upperFloor = upper.envelope.min[1] + explodeOffset(lowerIndex + 1, amount, gap);
  return upperFloor - lowerTop;
}

/** The lift `progress` (0–1, eased) of the way from one value to another. */
export function easeLift(from: number, to: number, progress: number): number {
  return from + (to - from) * easeInOutCubic(progress);
}

/** Whole percent for a readout: 0.425 → 43. */
export function explodePercent(amount: number): number {
  return Math.round(clampUnit(amount) * 100);
}
