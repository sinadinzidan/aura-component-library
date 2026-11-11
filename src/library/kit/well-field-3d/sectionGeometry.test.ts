import { axisSteps, crossingAt, deepestPoint, furthestPoint, horizonLabelSide, sectionFrame, sectionPath } from './sectionGeometry';
import type { SectionPoint } from './sectionGeometry';

const MARGIN = { top: 40, right: 20, bottom: 30, left: 50 };

const PATH: readonly SectionPoint[] = [
  { departure: 0, tvd: 0 },
  { departure: 0, tvd: 500 },
  { departure: 800, tvd: 1500 },
  { departure: 2000, tvd: 1600 },
];

describe(sectionFrame.name, () => {
  it('uses one scale for both axes, limited by the tighter one', () => {
    const frame = sectionFrame({ width: 550, height: 370 }, MARGIN, 2400, 3000);

    expect(frame.scale).toBeCloseTo(0.1);
    expect(frame.plot).toEqual({ left: 50, top: 40, width: 240, height: 300 });
  });

  it('puts the wellhead in the top left corner of the plot', () => {
    const frame = sectionFrame({ width: 550, height: 370 }, MARGIN, 2400, 3000);

    expect(frame.x(0)).toBe(50);
    expect(frame.y(0)).toBe(40);
    expect(frame.x(1000)).toBeCloseTo(150);
    expect(frame.y(3000)).toBeCloseTo(340);
  });

  it('survives a drawing smaller than its margins', () => {
    const frame = sectionFrame({ width: 10, height: 10 }, MARGIN, 2400, 3000);

    expect(frame.scale).toBeGreaterThan(0);
  });
});

describe(sectionPath.name, () => {
  it('draws a move and then lines in drawing coordinates', () => {
    const frame = sectionFrame({ width: 550, height: 370 }, MARGIN, 2400, 3000);

    expect(sectionPath(PATH.slice(0, 3), frame)).toBe('M50.0 40.0 L50.0 90.0 L130.0 190.0');
  });

  it('is empty for a single point', () => {
    const frame = sectionFrame({ width: 550, height: 370 }, MARGIN, 2400, 3000);

    expect(sectionPath(PATH.slice(0, 1), frame)).toBe('');
  });
});

describe(axisSteps.name, () => {
  it('includes zero and the maximum', () => {
    expect(axisSteps(3000, 1000)).toEqual([0, 1000, 2000, 3000]);
  });

  it('stops below a maximum that is not a multiple', () => {
    expect(axisSteps(2400, 1000)).toEqual([0, 1000, 2000]);
  });

  it('falls back to zero for a step that makes no sense', () => {
    expect(axisSteps(3000, 0)).toEqual([0]);
  });
});

describe(crossingAt.name, () => {
  it('interpolates between the two points around the depth', () => {
    expect(crossingAt(PATH, 1000)).toEqual({ departure: 400, tvd: 1000 });
  });

  it('is null below the deepest point', () => {
    expect(crossingAt(PATH, 2500)).toBeNull();
  });
});

describe(deepestPoint.name, () => {
  it('finds the greatest depth', () => {
    expect(deepestPoint(PATH)).toEqual({ departure: 2000, tvd: 1600 });
  });

  it('is the origin for an empty path', () => {
    expect(deepestPoint([])).toEqual({ departure: 0, tvd: 0 });
  });
});

describe(furthestPoint.name, () => {
  it('finds the greatest departure', () => {
    expect(furthestPoint(PATH).departure).toBe(2000);
  });
});

describe(horizonLabelSide.name, () => {
  it('names a surface at the far end when the well passes it near the wellhead', () => {
    expect(horizonLabelSide(PATH, 600, 2400)).toBe('end');
  });

  it('moves the name to the wellhead end when the well runs near it far out', () => {
    expect(horizonLabelSide(PATH, 1550, 2400)).toBe('start');
  });

  it('keeps the far end for a surface well below the deepest point', () => {
    expect(horizonLabelSide(PATH, 2800, 2400)).toBe('end');
  });
});
