import { clamp, polarToCartesian, round2 } from '../../industrial/geometry';
import type { Point } from '../../industrial/geometry';

import type { Segment } from './perspective';

/** Pure layout for a radar scope. Angles are degrees, 0 at 12 o'clock, clockwise. */

export type Sector = { start: number; end: number; mid: number };

/** Equal sectors around the scope, the first starting at 12 o'clock. */
export function sectorBounds(index: number, count: number): Sector {
  const size = 360 / Math.max(count, 1);
  const start = index * size;
  return { start, end: start + size, mid: start + size / 2 };
}

export type RadiusScale = {
  /** Radius of the worst score. */
  inner: number;
  /** Radius of the best score. */
  outer: number;
  min?: number;
  max?: number;
};

/** Radius for a score: the best score sits on the outer ring, the worst sinks to the core. */
export function scoreRadius(score: number, scale: RadiusScale): number {
  const min = scale.min ?? 0;
  const max = scale.max ?? 100;
  const fraction = max > min ? clamp((score - min) / (max - min), 0, 1) : 0;
  return round2(scale.inner + fraction * (scale.outer - scale.inner));
}

export type BlipGroup<T> = { id: string; items: readonly T[] };
export type Blip<T> = { item: T; groupId: string; angle: number; radius: number; x: number; y: number };

export type BlipLayout = RadiusScale & {
  cx: number;
  cy: number;
  /** Degrees kept clear at both edges of a sector, so blips stay off the divider lines. */
  sectorPadding?: number;
};

/**
 * One blip per item: its group picks the sector, its position in the group the angle inside the
 * sector (spread evenly), and its score the radius.
 */
export function layoutBlips<T>(groups: readonly BlipGroup<T>[], score: (item: T) => number, layout: BlipLayout): Blip<T>[] {
  const padding = layout.sectorPadding ?? 12;
  return groups.flatMap((group, groupIndex) => {
    const sector = sectorBounds(groupIndex, groups.length);
    const usable = Math.max(sector.end - sector.start - padding * 2, 0);
    return group.items.map((item, itemIndex) => {
      const angle = round2(sector.start + padding + (usable * (itemIndex + 0.5)) / group.items.length);
      const radius = scoreRadius(score(item), layout);
      const point = polarToCartesian(layout.cx, layout.cy, radius, angle);
      return { item, groupId: group.id, angle, radius, x: point.x, y: point.y };
    });
  });
}

/** Tick marks around a ring, pointing inwards. Every `majorEvery`-th tick is `majorLength` long. */
export function ringTicks(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  length: number,
  majorEvery = 0,
  majorLength = length * 2
): Segment[] {
  return Array.from({ length: Math.max(count, 0) }, (_, index) => {
    const angle = (360 / count) * index;
    const tick = majorEvery > 0 && index % majorEvery === 0 ? majorLength : length;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const inner = polarToCartesian(cx, cy, radius - tick, angle);
    return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
  });
}

/** The id before or after `current`, wrapping round. With nothing current, the first or last. */
export function cycleTarget(ids: readonly string[], current: string | null, direction: 1 | -1): string | null {
  if (ids.length === 0) return null;
  const index = current === null ? -1 : ids.indexOf(current);
  if (index === -1) return direction === 1 ? ids[0] : ids[ids.length - 1];
  return ids[(index + direction + ids.length) % ids.length];
}

/** Ruler ticks along a straight edge from 0 to `length`: positions and whether each is a major tick. */
export function rulerTicks(length: number, step: number, majorEvery = 5): { position: number; major: boolean }[] {
  if (!(step > 0) || !(length > 0)) return [];
  const count = Math.floor(length / step + 1e-9);
  return Array.from({ length: count + 1 }, (_, index) => ({ position: round2(index * step), major: index % majorEvery === 0 }));
}

/** Where a label goes: just outside a point, pushed away from the centre. */
export function labelOffset(point: Point, cx: number, cy: number, distance: number): Point {
  const dx = point.x - cx;
  const dy = point.y - cy;
  const length = Math.hypot(dx, dy) || 1;
  return { x: round2(point.x + (dx / length) * distance), y: round2(point.y + (dy / length) * distance) };
}
