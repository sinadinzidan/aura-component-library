import { azimuthDelta, casingAtMd, deepestTvd, densifySurvey, pathPointToScene, pathToScene, planSurvey, plannedInclination, pointAtMd, pointAtTvd, wellPath } from './wellPath';
import type { SurveyStation, WellPlan } from './wellPath';

const VERTICAL: SurveyStation[] = [
  { md: 0, inc: 0, azi: 0 },
  { md: 500, inc: 0, azi: 0 },
  { md: 1000, inc: 0, azi: 0 },
];

/** A quarter circle of radius 1000 m from vertical to horizontal, heading east. */
const QUARTER: SurveyStation[] = Array.from({ length: 10 }, (_, index) => ({ md: (index / 9) * ((Math.PI * 1000) / 2), inc: index * 10, azi: 90 }));

describe(wellPath.name, () => {
  it('starts at the wellhead', () => {
    expect(wellPath(VERTICAL)[0]).toEqual({ md: 0, tvd: 0, north: 0, east: 0, inc: 0, azi: 0 });
  });

  it('keeps a vertical well straight down: TVD equals measured depth', () => {
    const path = wellPath(VERTICAL);

    expect(path[2].tvd).toBeCloseTo(1000);
    expect(path[2].north).toBeCloseTo(0);
    expect(path[2].east).toBeCloseTo(0);
  });

  it('runs a horizontal section out without gaining depth', () => {
    const path = wellPath([
      { md: 0, inc: 90, azi: 90 },
      { md: 800, inc: 90, azi: 90 },
    ]);

    expect(path[1].east).toBeCloseTo(800);
    expect(path[1].tvd).toBeCloseTo(0);
    expect(path[1].north).toBeCloseTo(0);
  });

  it('follows a circular arc through a build: a quarter circle ends one radius down and one radius out', () => {
    const end = wellPath(QUARTER)[QUARTER.length - 1];

    expect(end.tvd).toBeCloseTo(1000, 0);
    expect(end.east).toBeCloseTo(1000, 0);
    expect(end.north).toBeCloseTo(0, 5);
  });

  it('is exact for a single arc, where the balanced tangential method would fall short', () => {
    const end = wellPath([
      { md: 0, inc: 0, azi: 90 },
      { md: (Math.PI * 1000) / 2, inc: 90, azi: 90 },
    ])[1];

    expect(end.tvd).toBeCloseTo(1000, 6);
    expect(end.east).toBeCloseTo(1000, 6);
  });

  it('heads north for azimuth 0 and south for azimuth 180', () => {
    const north = wellPath([{ md: 0, inc: 90, azi: 0 }, { md: 100, inc: 90, azi: 0 }])[1];
    const south = wellPath([{ md: 0, inc: 90, azi: 180 }, { md: 100, inc: 90, azi: 180 }])[1];

    expect(north.north).toBeCloseTo(100);
    expect(south.north).toBeCloseTo(-100);
  });

  it('never gains more TVD than measured depth', () => {
    const path = wellPath(planSurvey({ kickoffMd: 400, buildRate: 3, holdInc: 55, azimuth: 40, tdMd: 3600 }));

    for (const point of path) expect(point.tvd).toBeLessThanOrEqual(point.md + 1e-6);
  });

  it('returns nothing for an empty survey', () => {
    expect(wellPath([])).toEqual([]);
  });
});

describe(azimuthDelta.name, () => {
  it('takes the short way round north', () => {
    expect(azimuthDelta(350, 10)).toBe(20);
    expect(azimuthDelta(10, 350)).toBe(-20);
  });

  it('is zero for the same heading', () => {
    expect(azimuthDelta(90, 90)).toBe(0);
  });
});

describe(densifySurvey.name, () => {
  it('adds stations at the given spacing and keeps the originals', () => {
    const dense = densifySurvey([{ md: 0, inc: 0, azi: 0 }, { md: 100, inc: 10, azi: 0 }], 25);

    expect(dense.map((station) => station.md)).toEqual([0, 25, 50, 75, 100]);
    expect(dense.map((station) => station.inc)).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('interpolates azimuth across north', () => {
    const dense = densifySurvey([{ md: 0, inc: 30, azi: 350 }, { md: 100, inc: 30, azi: 10 }], 50);

    expect(dense[1].azi).toBeCloseTo(0);
  });

  it('leaves the survey alone for a non-positive step', () => {
    expect(densifySurvey(VERTICAL, 0)).toEqual(VERTICAL);
  });
});

describe(plannedInclination.name, () => {
  const plan: WellPlan = { kickoffMd: 400, buildRate: 3, holdInc: 60, azimuth: 0, tdMd: 4000, landing: { startMd: 2600, inc: 90, buildRate: 3 } };

  it('is vertical above the kickoff point', () => {
    expect(plannedInclination(plan, 300)).toBe(0);
  });

  it('builds at the build rate', () => {
    expect(plannedInclination(plan, 700)).toBeCloseTo(30);
  });

  it('holds the tangent angle', () => {
    expect(plannedInclination(plan, 2000)).toBe(60);
  });

  it('builds again to land in the reservoir, and no further', () => {
    expect(plannedInclination(plan, 2750)).toBeCloseTo(75);
    expect(plannedInclination(plan, 3800)).toBe(90);
  });
});

describe(planSurvey.name, () => {
  it('starts at the wellhead and ends at total depth', () => {
    const survey = planSurvey({ kickoffMd: 450, buildRate: 3, holdInc: 40, azimuth: 120, tdMd: 3050 });

    expect(survey[0]).toEqual({ md: 0, inc: 0, azi: 120 });
    expect(survey[survey.length - 1].md).toBe(3050);
  });

  it('includes the kickoff and landing points and stays sorted', () => {
    const depths = planSurvey({ kickoffMd: 450, buildRate: 3, holdInc: 40, azimuth: 0, tdMd: 3000, landing: { startMd: 2250, inc: 88, buildRate: 4 } }).map((station) => station.md);

    expect(depths).toContain(450);
    expect(depths).toContain(2250);
    expect([...depths].sort((a, b) => a - b)).toEqual(depths);
  });

  it('turns the azimuth with the turn rate below the kickoff', () => {
    const survey = planSurvey({ kickoffMd: 500, buildRate: 3, holdInc: 40, azimuth: 350, tdMd: 1500, turnRate: 2 }, 500);

    expect(survey.map((station) => station.azi)).toEqual([350, 350, 0, 10]);
  });
});

describe(pointAtTvd.name, () => {
  const path = wellPath(VERTICAL);

  it('interpolates between stations', () => {
    expect(pointAtTvd(path, 250)?.md).toBeCloseTo(250);
  });

  it('returns null below the deepest point', () => {
    expect(pointAtTvd(path, 1200)).toBeNull();
  });

  it('returns null above the wellhead', () => {
    expect(pointAtTvd(path, -5)).toBeNull();
  });

  it('gives the first crossing for a well that lands horizontally', () => {
    const landed = wellPath(QUARTER);
    const point = pointAtTvd(landed, 500);

    expect(point?.tvd).toBeCloseTo(500);
    expect(point?.inc).toBeGreaterThan(20);
    expect(point?.inc).toBeLessThan(40);
  });
});

describe(pointAtMd.name, () => {
  const path = wellPath(VERTICAL);

  it('interpolates along the hole', () => {
    expect(pointAtMd(path, 750)?.tvd).toBeCloseTo(750);
  });

  it('returns the wellhead at zero', () => {
    expect(pointAtMd(path, 0)?.tvd).toBe(0);
  });

  it('returns null beyond total depth', () => {
    expect(pointAtMd(path, 1001)).toBeNull();
  });
});

describe(deepestTvd.name, () => {
  it('is the largest TVD on the path', () => {
    expect(deepestTvd(wellPath(VERTICAL))).toBeCloseTo(1000);
    expect(deepestTvd([])).toBe(0);
  });
});

describe(pathPointToScene.name, () => {
  it('maps east to +x, north to −z and depth to −y, scaled from the origin', () => {
    expect(pathPointToScene({ tvd: 1000, north: 200, east: 300 }, [1, 0, 2], 0.01)).toEqual([4, -10, 0]);
  });

  it('maps a whole path', () => {
    expect(pathToScene(wellPath(VERTICAL), [0, 0, 0], 0.01)[2][1]).toBeCloseTo(-10);
  });
});

describe(casingAtMd.name, () => {
  const casings = [
    { name: '9 5/8 in', shoeMd: 2400 },
    { name: '30 in', shoeMd: 180 },
    { name: '13 3/8 in', shoeMd: 1200 },
  ];

  it('returns the string whose shoe is next below the depth', () => {
    expect(casingAtMd(casings, 600)).toEqual({ casing: { name: '13 3/8 in', shoeMd: 1200 }, atShoe: false });
  });

  it('flags a depth at the shoe', () => {
    expect(casingAtMd(casings, 1190)?.atShoe).toBe(true);
    expect(casingAtMd(casings, 1215)?.casing.name).toBe('13 3/8 in');
  });

  it('returns null in open hole below the last shoe', () => {
    expect(casingAtMd(casings, 2600)).toBeNull();
  });
});
