import {
  centreOn,
  clampScale,
  clipRect,
  constrainViewport,
  fitRect,
  isRectVisible,
  mixViewports,
  overviewPoint,
  panBy,
  sameViewport,
  toScreen,
  toWorld,
  viewportFromRect,
  visibleRect,
  zoomAbout,
  zoomPercent,
  zoomTo,
} from './viewport';
import type { Viewport } from './viewport';

const SIZE = { width: 800, height: 400 };
const WORLD = { x: 0, y: 0, width: 1600, height: 800 };

describe('viewport', () => {
  it('clamps a scale to its limits', () => {
    expect(clampScale(10)).toBe(4);
    expect(clampScale(0.01)).toBe(0.25);
    expect(clampScale(3, { min: 1, max: 2 })).toBe(2);
  });

  it('converts between screen and world and back', () => {
    const viewport: Viewport = { x: 100, y: 50, k: 2 };
    const world = toWorld(viewport, { x: 40, y: 20 });
    expect(world).toEqual({ x: 120, y: 60 });
    expect(toScreen(viewport, world)).toEqual({ x: 40, y: 20 });
  });

  it('keeps the world point under the pointer when zooming about it', () => {
    const viewport: Viewport = { x: 100, y: 50, k: 1 };
    const anchor = { x: 300, y: 120 };
    const before = toWorld(viewport, anchor);

    const zoomed = zoomAbout(viewport, anchor, 2);

    expect(zoomed.k).toBe(2);
    expect(toWorld(zoomed, anchor)).toEqual(before);
  });

  it('stops at the zoom limits and returns the same viewport when nothing changes', () => {
    const viewport: Viewport = { x: 0, y: 0, k: 4 };
    expect(zoomAbout(viewport, { x: 10, y: 10 }, 2)).toBe(viewport);
    expect(zoomTo({ x: 0, y: 0, k: 1 }, { x: 0, y: 0 }, 0.01).k).toBe(0.25);
  });

  it('pans by a screen distance scaled to world units', () => {
    expect(panBy({ x: 100, y: 100, k: 2 }, 40, -20)).toEqual({ x: 80, y: 110, k: 2 });
  });

  it('returns the same viewport for an empty pan', () => {
    const viewport: Viewport = { x: 1, y: 2, k: 1 };
    expect(panBy(viewport, 0, 0)).toBe(viewport);
  });

  it('fits a rectangle with padding and centres it', () => {
    const viewport = fitRect(WORLD, SIZE, 0);
    expect(viewport.k).toBe(0.5);
    expect(visibleRect(viewport, SIZE)).toEqual(WORLD);

    const padded = fitRect(WORLD, SIZE, 40);
    expect(padded.k).toBeCloseTo(0.4);
    const shown = visibleRect(padded, SIZE);
    expect(shown.x + shown.width / 2).toBeCloseTo(800);
    expect(shown.y + shown.height / 2).toBeCloseTo(400);
  });

  it('does not zoom past the maximum when fitting something small', () => {
    expect(fitRect({ x: 0, y: 0, width: 10, height: 10 }, SIZE, 0, { min: 0.25, max: 2 }).k).toBe(2);
  });

  it('centres a point at a scale', () => {
    expect(centreOn({ x: 500, y: 300 }, SIZE, 2)).toEqual({ x: 300, y: 200, k: 2 });
  });

  it('round-trips a visible rectangle through viewportFromRect', () => {
    const viewport: Viewport = { x: 120, y: 60, k: 1.6 };
    expect(viewportFromRect(visibleRect(viewport, SIZE), SIZE)).toEqual(viewport);
  });

  it('tells whether a rectangle is fully on screen', () => {
    const viewport: Viewport = { x: 0, y: 0, k: 1 };
    expect(isRectVisible(viewport, SIZE, { x: 10, y: 10, width: 100, height: 100 })).toBe(true);
    expect(isRectVisible(viewport, SIZE, { x: 750, y: 10, width: 100, height: 100 })).toBe(false);
    expect(isRectVisible(viewport, SIZE, { x: 10, y: 10, width: 100, height: 100 }, 20)).toBe(false);
  });

  it('keeps part of the world in view however far the user pans', () => {
    const farRight = constrainViewport({ x: 5000, y: 0, k: 1 }, SIZE, WORLD, 64);
    expect(farRight.x).toBe(1600 - 64);
    const farLeft = constrainViewport({ x: -5000, y: -5000, k: 1 }, SIZE, WORLD, 64);
    expect(farLeft).toEqual({ x: -(800 - 64), y: -(400 - 64), k: 1 });
  });

  it('leaves a viewport inside the bounds untouched', () => {
    const viewport: Viewport = { x: 10, y: 10, k: 1 };
    expect(constrainViewport(viewport, SIZE, WORLD)).toBe(viewport);
  });

  it('mixes two viewports geometrically and lands on the ends', () => {
    const from: Viewport = { x: 0, y: 0, k: 1 };
    const to: Viewport = { x: 400, y: 200, k: 4 };
    expect(mixViewports(from, to, SIZE, 0)).toBe(from);
    expect(mixViewports(from, to, SIZE, 1)).toBe(to);
    expect(mixViewports(from, to, SIZE, 0.5).k).toBeCloseTo(2);
  });

  it('reads the scale as a percentage and compares viewports', () => {
    expect(zoomPercent({ x: 0, y: 0, k: 1.254 })).toBe(125);
    expect(sameViewport({ x: 0, y: 0, k: 1 }, { x: 0, y: 0, k: 1 })).toBe(true);
    expect(sameViewport({ x: 0, y: 0, k: 1 }, { x: 1, y: 0, k: 1 })).toBe(false);
  });

  it('maps a pointer on an overview to a world point and clamps it to the world', () => {
    const box = { left: 100, top: 50, width: 160, height: 80 };
    expect(overviewPoint(WORLD, box, 180, 90)).toEqual({ x: 800, y: 400 });
    expect(overviewPoint(WORLD, box, 0, 1000)).toEqual({ x: 0, y: 800 });
    expect(overviewPoint(WORLD, { left: 0, top: 0, width: 0, height: 0 }, 5, 5)).toEqual({ x: 800, y: 400 });
  });

  it('clips a visible rectangle to the world', () => {
    expect(clipRect({ x: -100, y: 700, width: 400, height: 400 }, WORLD)).toEqual({ x: 0, y: 700, width: 300, height: 100 });
    expect(clipRect({ x: 10, y: 10, width: 20, height: 20 }, WORLD)).toEqual({ x: 10, y: 10, width: 20, height: 20 });
  });
});
