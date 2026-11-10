import { WORLD_OUTLINES, outlinePointCount } from './continents';

describe('WORLD_OUTLINES', () => {
  it('gives every outline a unique id', () => {
    const ids = WORLD_OUTLINES.map((outline) => outline.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every latitude on the globe', () => {
    const latitudes = WORLD_OUTLINES.flatMap((outline) => outline.points.map((point) => point.lat));

    expect(Math.max(...latitudes)).toBeLessThanOrEqual(90);
    expect(Math.min(...latitudes)).toBeGreaterThanOrEqual(-90);
  });

  it('draws every outline with enough points to close', () => {
    expect(WORLD_OUTLINES.every((outline) => outline.points.length >= 3)).toBe(true);
  });

  it('includes the coast the fleet sits off', () => {
    const eurasia = WORLD_OUTLINES.find((outline) => outline.id === 'eurasia');
    const norwegianCoast = eurasia?.points.filter((point) => point.lat > 58 && point.lat < 72 && point.lon > 4 && point.lon < 31) ?? [];

    expect(norwegianCoast.length).toBeGreaterThan(12);
  });

  it('stays small enough to author by hand', () => {
    expect(outlinePointCount(WORLD_OUTLINES)).toBeLessThan(700);
  });
});

describe(outlinePointCount.name, () => {
  it('adds up the points of all outlines', () => {
    expect(
      outlinePointCount([
        { id: 'a', closed: true, points: [{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }] },
        { id: 'b', closed: false, points: [{ lat: 2, lon: 2 }] },
      ])
    ).toBe(3);
  });
});
