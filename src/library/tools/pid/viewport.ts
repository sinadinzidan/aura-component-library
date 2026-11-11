import { mixViewport } from '../../experiences/drilldown/planLayout';
import type { PlanRect } from '../../experiences/drilldown/planLayout';

/**
 * Pure pan and zoom maths for a canvas tool. A viewport is the world point at the top-left corner
 * of the screen plus a scale `k` in screen pixels per world unit, so a world point lands on screen
 * at `(world - origin) * k`.
 */

export type ViewPoint = { x: number; y: number };
export type ViewSize = { width: number; height: number };
export type Viewport = { x: number; y: number; k: number };
export type ZoomLimits = { min: number; max: number };

export const DEFAULT_ZOOM_LIMITS: ZoomLimits = { min: 0.25, max: 4 };

/** One notch of a zoom button or key press. */
export const ZOOM_STEP = 1.25;

export function clampScale(k: number, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): number {
  return Math.min(limits.max, Math.max(limits.min, k));
}

/** A screen point (pixels from the top-left of the canvas) in world units. */
export function toWorld(viewport: Viewport, point: ViewPoint): ViewPoint {
  return { x: viewport.x + point.x / viewport.k, y: viewport.y + point.y / viewport.k };
}

/** A world point in screen pixels. */
export function toScreen(viewport: Viewport, point: ViewPoint): ViewPoint {
  return { x: (point.x - viewport.x) * viewport.k, y: (point.y - viewport.y) * viewport.k };
}

/** Zooms to an absolute scale while the world point under `anchor` stays under it. */
export function zoomTo(viewport: Viewport, anchor: ViewPoint, k: number, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): Viewport {
  const next = clampScale(k, limits);
  if (next === viewport.k) return viewport;
  const world = toWorld(viewport, anchor);
  return { x: world.x - anchor.x / next, y: world.y - anchor.y / next, k: next };
}

/** Zooms by a factor about a screen point: the wheel, a pinch or a button about the centre. */
export function zoomAbout(viewport: Viewport, anchor: ViewPoint, factor: number, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): Viewport {
  return zoomTo(viewport, anchor, viewport.k * factor, limits);
}

/** Moves the drawing by a screen distance: dragging right shows what was to the left. */
export function panBy(viewport: Viewport, dx: number, dy: number): Viewport {
  if (dx === 0 && dy === 0) return viewport;
  return { x: viewport.x - dx / viewport.k, y: viewport.y - dy / viewport.k, k: viewport.k };
}

/** The viewport that shows all of `rect`, centred, with `padding` screen pixels of air. */
export function fitRect(rect: PlanRect, size: ViewSize, padding = 24, limits: ZoomLimits = DEFAULT_ZOOM_LIMITS): Viewport {
  const availableWidth = Math.max(1, size.width - padding * 2);
  const availableHeight = Math.max(1, size.height - padding * 2);
  const k = clampScale(Math.min(availableWidth / Math.max(1, rect.width), availableHeight / Math.max(1, rect.height)), limits);
  return centreOn({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, size, k);
}

/** The viewport at scale `k` with a world point in the middle of the screen. */
export function centreOn(point: ViewPoint, size: ViewSize, k: number): Viewport {
  return { x: point.x - size.width / k / 2, y: point.y - size.height / k / 2, k };
}

/** The part of the world on screen. */
export function visibleRect(viewport: Viewport, size: ViewSize): PlanRect {
  return { x: viewport.x, y: viewport.y, width: size.width / viewport.k, height: size.height / viewport.k };
}

/** The viewport whose screen shows exactly `rect` across its width. */
export function viewportFromRect(rect: PlanRect, size: ViewSize): Viewport {
  return { x: rect.x, y: rect.y, k: size.width / Math.max(1e-6, rect.width) };
}

/** Whether a world rectangle is fully on screen, with `margin` screen pixels to spare. */
export function isRectVisible(viewport: Viewport, size: ViewSize, rect: PlanRect, margin = 0): boolean {
  const topLeft = toScreen(viewport, { x: rect.x, y: rect.y });
  const bottomRight = toScreen(viewport, { x: rect.x + rect.width, y: rect.y + rect.height });
  return topLeft.x >= margin && topLeft.y >= margin && bottomRight.x <= size.width - margin && bottomRight.y <= size.height - margin;
}

/**
 * Keeps the drawing reachable: however far the user pans, at least `keep` screen pixels of the
 * world stay inside the canvas on each axis.
 */
export function constrainViewport(viewport: Viewport, size: ViewSize, world: PlanRect, keep = 64): Viewport {
  const { k } = viewport;
  const minX = world.x - (size.width - keep) / k;
  const maxX = world.x + world.width - keep / k;
  const minY = world.y - (size.height - keep) / k;
  const maxY = world.y + world.height - keep / k;
  const x = Math.min(Math.max(viewport.x, Math.min(minX, maxX)), Math.max(minX, maxX));
  const y = Math.min(Math.max(viewport.y, Math.min(minY, maxY)), Math.max(minY, maxY));
  return x === viewport.x && y === viewport.y ? viewport : { x, y, k };
}

/**
 * A viewport part of the way between two others, for a fly-to. The scale moves geometrically and
 * the centre follows it, so the flight feels even instead of rushing at one end.
 */
export function mixViewports(from: Viewport, to: Viewport, size: ViewSize, progress: number): Viewport {
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  return viewportFromRect(mixViewport(visibleRect(from, size), visibleRect(to, size), progress), size);
}

/** Scale as a whole percentage, for the toolbar readout. */
export const zoomPercent = (viewport: Viewport): number => Math.round(viewport.k * 100);

/** Whether two viewports are the same to within a rounding error. */
export function sameViewport(a: Viewport, b: Viewport): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.k - b.k) < 1e-9;
}

export type ClientBox = { left: number; top: number; width: number; height: number };

/**
 * The world point under a pointer on an overview that shows all of `world` stretched over `box`
 * (a mini-map). Clamped to the world, so a drag that leaves the map stays on its edge.
 */
export function overviewPoint(world: PlanRect, box: ClientBox, clientX: number, clientY: number): ViewPoint {
  const fx = box.width > 0 ? Math.min(1, Math.max(0, (clientX - box.left) / box.width)) : 0.5;
  const fy = box.height > 0 ? Math.min(1, Math.max(0, (clientY - box.top) / box.height)) : 0.5;
  return { x: world.x + fx * world.width, y: world.y + fy * world.height };
}

/** The viewport's visible rectangle clipped to the world, for drawing the frame on an overview. */
export function clipRect(rect: PlanRect, world: PlanRect): PlanRect {
  const x = Math.min(Math.max(rect.x, world.x), world.x + world.width);
  const y = Math.min(Math.max(rect.y, world.y), world.y + world.height);
  const right = Math.min(Math.max(rect.x + rect.width, world.x), world.x + world.width);
  const bottom = Math.min(Math.max(rect.y + rect.height, world.y), world.y + world.height);
  return { x, y, width: right - x, height: bottom - y };
}
