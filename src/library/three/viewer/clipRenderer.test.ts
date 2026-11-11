import { Vector3 } from 'three';

import { enableLocalClipping, toThreePlane } from './clipRenderer';

describe('toThreePlane', () => {
  it('builds a three.js plane from a normal and a constant', () => {
    const plane = toThreePlane({ normal: [-1, 0, 0], constant: 5 });

    expect(plane.normal.toArray()).toEqual([-1, 0, 0]);
    expect(plane.constant).toBe(5);
  });

  it('keeps points on the near side and clips points beyond it', () => {
    const plane = toThreePlane({ normal: [-1, 0, 0], constant: 5 });

    expect(plane.distanceToPoint(new Vector3(2, 0, 0))).toBeGreaterThan(0);
  });
});

describe('enableLocalClipping', () => {
  it('switches local clipping on', () => {
    const renderer = { localClippingEnabled: false };

    enableLocalClipping(renderer);

    expect(renderer.localClippingEnabled).toBe(true);
  });
});
