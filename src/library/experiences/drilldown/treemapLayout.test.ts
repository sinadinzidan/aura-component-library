import { aspectRatio, frameAround, squarify } from './treemapLayout';
import type { TreemapRect } from './treemapLayout';

const BOUNDS = { x: 0, y: 0, width: 100, height: 60 };
const area = (rect: TreemapRect): number => rect.width * rect.height;

const overlaps = (a: TreemapRect, b: TreemapRect): boolean =>
  a.x < b.x + b.width - 1e-6 && b.x < a.x + a.width - 1e-6 && a.y < b.y + b.height - 1e-6 && b.y < a.y + a.height - 1e-6;

describe(squarify.name, () => {
  const items = [
    { id: 'a', value: 6 },
    { id: 'b', value: 6 },
    { id: 'c', value: 4 },
    { id: 'd', value: 3 },
    { id: 'e', value: 2 },
    { id: 'f', value: 2 },
    { id: 'g', value: 1 },
  ];

  it('gives every item an area proportional to its value', () => {
    const rects = squarify(items, BOUNDS);

    for (const rect of rects) expect(area(rect)).toBeCloseTo((rect.value / 24) * 6000, 6);
  });

  it('tiles the bounds exactly, without overlap', () => {
    const rects = squarify(items, BOUNDS);

    expect(rects.reduce((sum, rect) => sum + area(rect), 0)).toBeCloseTo(6000, 6);
    rects.forEach((rect, index) => {
      expect(rect.x).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.y).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.x + rect.width).toBeLessThanOrEqual(100 + 1e-9);
      expect(rect.y + rect.height).toBeLessThanOrEqual(60 + 1e-9);
      rects.slice(index + 1).forEach((other) => expect(overlaps(rect, other)).toBe(false));
    });
  });

  it('keeps rectangles close to square', () => {
    const rects = squarify(items, BOUNDS);

    expect(Math.max(...rects.map(aspectRatio))).toBeLessThan(3);
  });

  it('places the largest item first, at the origin', () => {
    const [first] = squarify([{ id: 'small', value: 1 }, { id: 'big', value: 9 }], BOUNDS);

    expect(first).toMatchObject({ id: 'big', x: 0, y: 0 });
  });

  it('fills the bounds with a single item', () => {
    expect(squarify([{ id: 'only', value: 3 }], BOUNDS)).toEqual([{ id: 'only', value: 3, share: 1, ...BOUNDS }]);
  });

  it('honours an offset origin', () => {
    const rects = squarify(items, { x: 10, y: 20, width: 50, height: 50 });

    expect(Math.min(...rects.map((rect) => rect.x))).toBeCloseTo(10);
    expect(Math.min(...rects.map((rect) => rect.y))).toBeCloseTo(20);
  });

  it('drops zero values unless a minimum share keeps them', () => {
    const withZero = [{ id: 'a', value: 5 }, { id: 'zero', value: 0 }];

    expect(squarify(withZero, BOUNDS).map((rect) => rect.id)).toEqual(['a']);
    expect(squarify(withZero, BOUNDS, { minShare: 0.1 }).map((rect) => rect.id)).toEqual(['a', 'zero']);
  });

  it('keeps the real value and reports the drawn share under a minimum share', () => {
    const rects = squarify([{ id: 'a', value: 9 }, { id: 'zero', value: 0 }], BOUNDS, { minShare: 0.1 });
    const zero = rects.find((rect) => rect.id === 'zero');

    expect(zero?.value).toBe(0);
    expect(zero?.share).toBeCloseTo(0.1 / 1.1, 6);
  });

  it('splits evenly when every value is zero', () => {
    const rects = squarify([{ id: 'a', value: 0 }, { id: 'b', value: 0 }], BOUNDS);

    expect(rects.map((rect) => rect.share)).toEqual([0.5, 0.5]);
  });

  it('treats negative and non-finite values as zero', () => {
    const rects = squarify([{ id: 'a', value: 4 }, { id: 'b', value: -2 }, { id: 'c', value: Number.NaN }], BOUNDS);

    expect(rects.map((rect) => rect.id)).toEqual(['a']);
  });

  it('returns nothing for no items or empty bounds', () => {
    expect(squarify([], BOUNDS)).toEqual([]);
    expect(squarify([{ id: 'a', value: 1 }], { x: 0, y: 0, width: 0, height: 10 })).toEqual([]);
  });
});

describe(aspectRatio.name, () => {
  it('is the long side over the short side', () => {
    expect(aspectRatio({ width: 10, height: 10 })).toBe(1);
    expect(aspectRatio({ width: 5, height: 20 })).toBe(4);
    expect(aspectRatio({ width: 0, height: 20 })).toBe(Infinity);
  });
});

describe(frameAround.name, () => {
  it('returns the frame in which the inner rectangle covers the outer one', () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 50, y: 25, width: 25, height: 50 };
    const frame = frameAround(inner, outer);

    // Map the inner rectangle through the frame: it must land exactly on the outer one.
    const mappedX = frame.x + (inner.x / outer.width) * frame.width;
    const mappedY = frame.y + (inner.y / outer.height) * frame.height;
    expect(frame).toEqual({ x: -200, y: -50, width: 400, height: 200 });
    expect(mappedX).toBeCloseTo(0);
    expect(mappedY).toBeCloseTo(0);
    expect((inner.width / outer.width) * frame.width).toBeCloseTo(100);
  });

  it('is the outer frame itself when the inner rectangle already fills it', () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };

    expect(frameAround(outer, outer)).toEqual(outer);
  });
});
