import { bendIndices, catenaryParameter, catenaryPoints, lazyWavePoints } from './lazyWave';

const TOP = [40, 44, -4] as const;
const TOUCHDOWN = [8, 0.4, 2] as const;

describe(lazyWavePoints.name, () => {
  it('starts at the hang-off and ends at the touchdown', () => {
    const points = lazyWavePoints(TOP, TOUCHDOWN);

    expect(points[0]).toEqual([40, 44, -4]);
    expect(points[points.length - 1][0]).toBeCloseTo(8, 9);
    expect(points[points.length - 1][1]).toBeCloseTo(0.4, 9);
    expect(points[points.length - 1][2]).toBeCloseTo(2, 9);
  });

  it('has one sag bend followed by one hog bend', () => {
    const { sag, hog } = bendIndices(lazyWavePoints(TOP, TOUCHDOWN, { segments: 48 }));

    expect(sag).toHaveLength(1);
    expect(hog).toHaveLength(1);
    expect(hog[0]).toBeGreaterThan(sag[0]);
  });

  it('lifts the hog bend above the sag bend', () => {
    const points = lazyWavePoints(TOP, TOUCHDOWN, { segments: 48 });
    const { sag, hog } = bendIndices(points);

    expect(points[hog[0]][1]).toBeGreaterThan(points[sag[0]][1] + 2);
  });

  it('never rises above the vessel or sinks below the touchdown', () => {
    for (const [, y] of lazyWavePoints(TOP, TOUCHDOWN, { segments: 60 })) {
      expect(y).toBeLessThanOrEqual(44);
      expect(y).toBeGreaterThanOrEqual(0.4 - 1e-9);
    }
  });

  it('moves steadily across the plan', () => {
    const points = lazyWavePoints(TOP, TOUCHDOWN, { segments: 10 });

    expect(points[5][0]).toBeCloseTo(24, 9);
    expect(points[5][2]).toBeCloseTo(-1, 9);
  });

  it('is a plain descent without sag and hump', () => {
    const { sag, hog } = bendIndices(lazyWavePoints(TOP, TOUCHDOWN, { sag: 0, hump: 0, segments: 40 }));

    expect(sag).toHaveLength(0);
    expect(hog).toHaveLength(0);
  });

  it('gives one more point than segments and at least two segments', () => {
    expect(lazyWavePoints(TOP, TOUCHDOWN, { segments: 12 })).toHaveLength(13);
    expect(lazyWavePoints(TOP, TOUCHDOWN, { segments: 0 })).toHaveLength(3);
  });
});

describe(catenaryParameter.name, () => {
  it('solves a (cosh(span / a) − 1) = rise', () => {
    const a = catenaryParameter(55, 44);

    expect(a * (Math.cosh(55 / a) - 1)).toBeCloseTo(44, 6);
  });

  it('is larger for a flatter line', () => {
    expect(catenaryParameter(60, 10)).toBeGreaterThan(catenaryParameter(60, 40));
  });

  it('handles the degenerate cases', () => {
    expect(catenaryParameter(0, 10)).toBe(0);
    expect(catenaryParameter(10, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns its steepest line for a nearly vertical one', () => {
    expect(catenaryParameter(1, 1e30)).toBeCloseTo(1 / 40, 9);
  });
});

describe(catenaryPoints.name, () => {
  const anchor = [0, 1, 0] as const;
  const fairlead = [30, 45, 40] as const;

  it('runs from the anchor to the fairlead', () => {
    const points = catenaryPoints(anchor, fairlead, 16);

    expect(points).toHaveLength(17);
    expect(points[0]).toEqual([0, 1, 0]);
    expect(points[16]).toEqual([30, 45, 40]);
  });

  it('lies nearly flat at the anchor and steepens towards the vessel', () => {
    const points = catenaryPoints(anchor, fairlead, 20);
    const firstStep = points[1][1] - points[0][1];
    const lastStep = points[20][1] - points[19][1];

    expect(firstStep).toBeGreaterThanOrEqual(0);
    expect(lastStep).toBeGreaterThan(firstStep * 5);
  });

  it('hangs below the straight line between its ends', () => {
    const points = catenaryPoints(anchor, fairlead, 10);

    expect(points[5][1]).toBeLessThan((1 + 45) / 2);
  });

  it('climbs straight up when anchor and fairlead share a plan position', () => {
    const points = catenaryPoints([0, 0, 0], [0, 10, 0], 2);

    expect(points.map((point) => point[1])).toEqual([0, 5, 10]);
  });
});
