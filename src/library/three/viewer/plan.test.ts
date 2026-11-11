import type { PlanSpace } from './plan';
import { planBox, planHeading, planPoint, planScale, viewConePath } from './plan';
import { VIEWER_BOUNDS } from './viewerModel';

const space = { bounds: { min: [-10, 0, -5], max: [10, 3, 5] }, width: 120, height: 80, padding: 10 } as const;

describe('plan projection', () => {
  it('scales to fit the limiting dimension', () => {
    expect(planScale(space)).toBe(5);
  });

  it('centres the bounds in the map', () => {
    expect(planPoint([0, 0, 0], space)).toEqual({ x: 60, y: 40 });
    expect(planPoint([10, 0, 5], space)).toEqual({ x: 110, y: 65 });
  });

  it('turns a world box into a map rectangle', () => {
    expect(planBox(space.bounds, space)).toEqual({ x: 10, y: 15, width: 100, height: 50 });
  });

  it('handles degenerate bounds without dividing by zero', () => {
    const flat: PlanSpace = { ...space, bounds: { min: [0, 0, 0], max: [0, 0, 0] } };
    expect(Number.isFinite(planScale(flat))).toBe(true);
  });

  it('keeps the real model inside the map', () => {
    const real = { bounds: VIEWER_BOUNDS, width: 160, height: 100, padding: 8 };
    const box = planBox(VIEWER_BOUNDS, real);
    expect(box.x).toBeGreaterThanOrEqual(8 - 1e-9);
    expect(box.x + box.width).toBeLessThanOrEqual(152 + 1e-9);
  });
});

describe('heading and cone', () => {
  it('reads compass heading clockwise from the top of the map', () => {
    expect(planHeading({ position: [0, 5, 10], lookAt: [0, 0, 0] })).toBeCloseTo(0);
    expect(planHeading({ position: [-10, 5, 0], lookAt: [0, 0, 0] })).toBeCloseTo(90);
    expect(planHeading({ position: [0, 5, -10], lookAt: [0, 0, 0] })).toBeCloseTo(180);
    expect(planHeading({ position: [10, 5, 0], lookAt: [0, 0, 0] })).toBeCloseTo(270);
  });

  it('draws a closed wedge from the camera', () => {
    const path = viewConePath({ position: [0, 5, 4], lookAt: [0, 0, 0] }, space);
    expect(path.startsWith('M 60.0 ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path.match(/L/g)).toHaveLength(2);
  });
});
