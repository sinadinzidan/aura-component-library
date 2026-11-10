import { round2 } from './geometry';
import type { Point } from './geometry';

/** Pure path building for `Sparkline`. Coordinates are SVG user units, y grows downwards. */

export type Domain = readonly [number, number];

export type PlotBox = {
  width: number;
  height: number;
  /** Horizontal inset, so round caps and markers are not clipped. */
  paddingX?: number;
  paddingY?: number;
};

export type Rect = { x: number; y: number; width: number; height: number };

/** Min and max of the values plus anything else that must stay visible (limits, bands). */
export function valueDomain(values: readonly number[], include: readonly number[] = []): Domain {
  const all = [...values, ...include].filter((value) => Number.isFinite(value));
  if (all.length === 0) return [0, 1];
  const min = Math.min(...all);
  const max = Math.max(...all);
  return min === max ? [min - 1, max + 1] : [min, max];
}

/** Vertical position of a value. Values outside the domain are clamped to the plot edge. */
export function scaleY(value: number, domain: Domain, box: PlotBox): number {
  const padding = box.paddingY ?? 0;
  const [min, max] = domain;
  const span = max - min || 1;
  const fraction = Math.min(1, Math.max(0, (value - min) / span));
  return round2(box.height - padding - fraction * (box.height - padding * 2));
}

/** One point per value, spread evenly across the width. A single value sits in the middle. */
export function scalePoints(values: readonly number[], domain: Domain, box: PlotBox): Point[] {
  const padding = box.paddingX ?? 0;
  const inner = box.width - padding * 2;
  return values.map((value, index) => ({
    x: round2(values.length === 1 ? box.width / 2 : padding + (index / (values.length - 1)) * inner),
    y: scaleY(value, domain, box),
  }));
}

export function linePath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

/** The line closed down to a baseline, for the area fill. */
export function areaPath(points: readonly Point[], baselineY: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  return `${linePath(points)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

/** One bar per value, rising from the bottom of the plot. Every bar is at least `minHeight` tall. */
export function barRects(values: readonly number[], domain: Domain, box: PlotBox, gap = 1, minHeight = 1): Rect[] {
  if (values.length === 0) return [];
  const padding = box.paddingX ?? 0;
  const inner = box.width - padding * 2;
  const step = inner / values.length;
  const width = Math.max(step - gap, step / 2);
  const bottom = box.height - (box.paddingY ?? 0);
  return values.map((value, index) => {
    const top = Math.min(scaleY(value, domain, box), bottom - minHeight);
    return {
      x: round2(padding + index * step + (step - width) / 2),
      y: round2(top),
      width: round2(width),
      height: round2(bottom - top),
    };
  });
}
