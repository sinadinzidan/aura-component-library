import { isoBox, isoPoint, isoPoints } from './iso';

const VIEW = { originX: 100, originY: 50, unit: 20 };

describe('isoPoint', () => {
  it('puts the grid origin at the view origin', () => {
    expect(isoPoint(VIEW, 0, 0)).toEqual({ x: 100, y: 50 });
  });

  it('sends x to the lower right and y to the lower left', () => {
    expect(isoPoint(VIEW, 1, 0)).toEqual({ x: 117.3, y: 60 });
    expect(isoPoint(VIEW, 0, 1)).toEqual({ x: 82.7, y: 60 });
  });

  it('raises a point by its height', () => {
    expect(isoPoint(VIEW, 0, 0, 2)).toEqual({ x: 100, y: 10 });
  });
});

describe('isoPoints', () => {
  it('joins projected points for a points attribute', () => {
    expect(
      isoPoints(VIEW, [
        [0, 0, 0],
        [1, 1, 0],
      ])
    ).toBe('100,50 100,70');
  });
});

describe('isoBox', () => {
  it('returns the three visible faces', () => {
    const box = isoBox(VIEW, 0, 0, 1, 1, 1);
    expect(box.top).toBe('100,30 117.3,40 100,50 82.7,40');
    expect(box.left).toBe('82.7,60 100,70 100,50 82.7,40');
    expect(box.right).toBe('117.3,60 100,70 100,50 117.3,40');
  });
});
