import { areaPath, barRects, linePath, scalePoints, scaleY, valueDomain } from './sparklinePath';

const box = { width: 100, height: 20 };

describe(valueDomain.name, () => {
  it('spans the values', () => {
    expect(valueDomain([3, 9, 5])).toEqual([3, 9]);
  });

  it('includes extra values such as limits', () => {
    expect(valueDomain([3, 9], [12, 0])).toEqual([0, 12]);
  });

  it('opens a flat series by one either side', () => {
    expect(valueDomain([4, 4, 4])).toEqual([3, 5]);
  });

  it('falls back to 0–1 without values', () => {
    expect(valueDomain([])).toEqual([0, 1]);
  });
});

describe(scaleY.name, () => {
  it('puts the maximum at the top and the minimum at the bottom', () => {
    expect(scaleY(10, [0, 10], box)).toBe(0);
    expect(scaleY(0, [0, 10], box)).toBe(20);
  });

  it('respects vertical padding', () => {
    expect(scaleY(10, [0, 10], { ...box, paddingY: 2 })).toBe(2);
    expect(scaleY(0, [0, 10], { ...box, paddingY: 2 })).toBe(18);
  });

  it('clamps values outside the domain', () => {
    expect(scaleY(50, [0, 10], box)).toBe(0);
  });
});

describe(scalePoints.name, () => {
  it('spreads points evenly across the width', () => {
    expect(scalePoints([0, 5, 10], [0, 10], box)).toEqual([
      { x: 0, y: 20 },
      { x: 50, y: 10 },
      { x: 100, y: 0 },
    ]);
  });

  it('insets by the horizontal padding', () => {
    const points = scalePoints([0, 10], [0, 10], { ...box, paddingX: 4 });

    expect(points.map((point) => point.x)).toEqual([4, 96]);
  });

  it('centres a single value', () => {
    expect(scalePoints([5], [0, 10], box)).toEqual([{ x: 50, y: 10 }]);
  });
});

describe(linePath.name, () => {
  it('moves to the first point and draws lines to the rest', () => {
    expect(
      linePath([
        { x: 0, y: 20 },
        { x: 50, y: 10 },
        { x: 100, y: 0 },
      ])
    ).toBe('M 0 20 L 50 10 L 100 0');
  });

  it('is empty without points', () => {
    expect(linePath([])).toBe('');
  });
});

describe(areaPath.name, () => {
  it('closes the line down to the baseline', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 5 },
          { x: 100, y: 0 },
        ],
        20
      )
    ).toBe('M 0 5 L 100 0 L 100 20 L 0 20 Z');
  });

  it('is empty without points', () => {
    expect(areaPath([], 20)).toBe('');
  });
});

describe(barRects.name, () => {
  it('draws one bar per value from the bottom', () => {
    const rects = barRects([5, 10], [0, 10], box, 0);

    expect(rects).toEqual([
      { x: 0, y: 10, width: 50, height: 10 },
      { x: 50, y: 0, width: 50, height: 20 },
    ]);
  });

  it('leaves a gap between bars', () => {
    const rects = barRects([5, 10], [0, 10], box, 2);

    expect(rects[0]).toMatchObject({ x: 1, width: 48 });
  });

  it('keeps a minimum height for the smallest value', () => {
    const rects = barRects([0, 10], [0, 10], box, 0, 1);

    expect(rects[0]).toMatchObject({ y: 19, height: 1 });
  });

  it('is empty without values', () => {
    expect(barRects([], [0, 10], box)).toEqual([]);
  });
});
