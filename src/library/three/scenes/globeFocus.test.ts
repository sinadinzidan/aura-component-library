import { angularSpread, centroid, focusView, groupView } from './globeFocus';

const NORTH_SEA = [
  { lat: 56.3, lon: 3.4 },
  { lat: 61.3, lon: 2.3 },
  { lat: 58.8, lon: 2.4 },
];

describe(centroid.name, () => {
  it('is the place itself for a single place', () => {
    const middle = centroid([{ lat: 60, lon: 5 }]);

    expect(middle?.lat).toBeCloseTo(60, 9);
    expect(middle?.lon).toBeCloseTo(5, 9);
  });

  it('lies between two places on the same meridian', () => {
    const middle = centroid([{ lat: 50, lon: 10 }, { lat: 70, lon: 10 }]);

    expect(middle?.lat).toBeCloseTo(60, 9);
    expect(middle?.lon).toBeCloseTo(10, 9);
  });

  it('handles places either side of the antimeridian', () => {
    const middle = centroid([{ lat: 0, lon: 170 }, { lat: 0, lon: -170 }]);

    expect(Math.abs(middle?.lon ?? 0)).toBeCloseTo(180, 6);
  });

  it('returns null for no places and for places that cancel out', () => {
    expect(centroid([])).toBeNull();
    expect(centroid([{ lat: 0, lon: 0 }, { lat: 0, lon: 180 }])).toBeNull();
  });
});

describe(angularSpread.name, () => {
  it('is zero for no places', () => {
    expect(angularSpread({ lat: 60, lon: 5 }, [])).toBe(0);
  });

  it('is the angle to the furthest place', () => {
    const spread = angularSpread({ lat: 60, lon: 5 }, [{ lat: 61, lon: 5 }, { lat: 70, lon: 5 }]);

    expect(spread).toBeCloseTo((10 * Math.PI) / 180, 9);
  });
});

describe(focusView.name, () => {
  it('stands above the place at the near distance', () => {
    expect(focusView({ lat: 65.3, lon: 7.2 }, 10)).toEqual({ lat: 65.3, lon: 7.2, distance: 22 });
  });

  it('takes a custom near distance', () => {
    expect(focusView({ lat: 65.3, lon: 7.2 }, 10, { near: 1.5 }).distance).toBe(15);
  });
});

describe(groupView.name, () => {
  it('stands above the middle of the group', () => {
    const view = groupView(NORTH_SEA, 10);

    expect(view?.lat).toBeGreaterThan(56.3);
    expect(view?.lat).toBeLessThan(61.3);
    expect(view?.lon).toBeGreaterThan(2);
    expect(view?.lon).toBeLessThan(3.5);
  });

  it('stands further out for a wider group, up to the whole-globe distance', () => {
    const tight = groupView(NORTH_SEA, 10);
    const wide = groupView([...NORTH_SEA, { lat: 73.4, lon: 21.8 }], 10);
    const world = groupView([{ lat: 60, lon: 5 }, { lat: -30, lon: 100 }], 10);

    expect(wide?.distance).toBeGreaterThan(tight?.distance ?? 0);
    expect(world?.distance).toBe(34);
  });

  it('is as close as a single-place focus for one place', () => {
    expect(groupView([{ lat: 60, lon: 5 }], 10)?.distance).toBeCloseTo(22, 6);
  });

  it('returns null for no places', () => {
    expect(groupView([], 10)).toBeNull();
  });
});
