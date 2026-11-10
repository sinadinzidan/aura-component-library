import { partRadius, partSlice, quantizeFraction, scanHeight, scanRange, scanReducer, sectionRadiusAt, slicesAt, sweepFraction } from './scanSweep';
import type { WireframePart } from './scanSweep';

const MOTOR: WireframePart = { id: 'motor', shape: 'cylinder', center: [0, 2, 0], height: 2, radius: 1.2 };
const COUPLING: WireframePart = { id: 'coupling', shape: 'cylinder', center: [0, 3.5, 0], height: 1, radius: 0.4, radiusTop: 0.6 };
const BOX: WireframePart = { id: 'box', shape: 'box', center: [0, 3.5, 0], height: 0.4, width: 3, depth: 4 };
const SLICES = [MOTOR, COUPLING, BOX].map(partSlice);

describe(partRadius.name, () => {
  it('is the larger end of a cylinder', () => {
    expect(partRadius(COUPLING)).toBe(0.6);
  });

  it('is half the diagonal of a box', () => {
    expect(partRadius(BOX)).toBe(2.5);
  });
});

describe(partSlice.name, () => {
  it('spans the part along the scan axis', () => {
    expect(partSlice(MOTOR)).toEqual({ id: 'motor', from: 1, to: 3, radius: 1.2 });
  });
});

describe(slicesAt.name, () => {
  it('returns the parts the plane passes, lowest first', () => {
    expect(slicesAt(SLICES, 3.5).map((slice) => slice.id)).toEqual(['coupling', 'box']);
  });

  it('includes a part at its boundary', () => {
    expect(slicesAt(SLICES, 3).map((slice) => slice.id)).toEqual(['motor', 'coupling']);
  });

  it('is empty in a gap', () => {
    expect(slicesAt(SLICES, 0.5)).toEqual([]);
  });
});

describe(sectionRadiusAt.name, () => {
  it('is the widest part at that height', () => {
    expect(sectionRadiusAt(SLICES, 3.5)).toBe(2.5);
    expect(sectionRadiusAt(SLICES, 2)).toBe(1.2);
  });

  it('is null in a gap', () => {
    expect(sectionRadiusAt(SLICES, 9)).toBeNull();
  });
});

describe(scanRange.name, () => {
  it('covers every slice', () => {
    expect(scanRange(SLICES)).toEqual({ min: 1, max: 4 });
  });

  it('is zero without slices', () => {
    expect(scanRange([])).toEqual({ min: 0, max: 0 });
  });
});

describe(sweepFraction.name, () => {
  it('starts at the bottom', () => {
    expect(sweepFraction(0, 10)).toBe(0);
  });

  it('reaches the top half way through the period', () => {
    expect(sweepFraction(5, 10)).toBe(1);
  });

  it('comes back down in the second half', () => {
    expect(sweepFraction(7.5, 10)).toBeCloseTo(0.5);
  });

  it('repeats every period', () => {
    expect(sweepFraction(12.5, 10)).toBeCloseTo(sweepFraction(2.5, 10));
  });

  it('holds at the bottom for a non-positive period', () => {
    expect(sweepFraction(3, 0)).toBe(0);
  });
});

describe(scanHeight.name, () => {
  it('maps a fraction onto the range', () => {
    expect(scanHeight({ min: 1, max: 5 }, 0.25)).toBe(2);
  });

  it('clamps the fraction', () => {
    expect(scanHeight({ min: 1, max: 5 }, 2)).toBe(5);
    expect(scanHeight({ min: 1, max: 5 }, -1)).toBe(1);
  });
});

describe(quantizeFraction.name, () => {
  it('rounds to the nearest step', () => {
    expect(quantizeFraction(0.4567)).toBe(0.46);
    expect(quantizeFraction(0.34, 10)).toBe(0.3);
  });

  it('clamps to 0–1', () => {
    expect(quantizeFraction(1.4)).toBe(1);
    expect(quantizeFraction(-0.2)).toBe(0);
  });
});

describe(scanReducer.name, () => {
  it('follows the sweep while it runs', () => {
    expect(scanReducer({ scan: 0.2, auto: true }, { type: 'sweep', fraction: 0.31 })).toEqual({ scan: 0.31, auto: true });
  });

  it('stops the sweep when the plane is moved by hand', () => {
    expect(scanReducer({ scan: 0.2, auto: true }, { type: 'moveTo', fraction: 0.57 })).toEqual({ scan: 0.57, auto: false });
  });

  it('ignores a late sweep report after a manual move', () => {
    const moved = scanReducer({ scan: 0.2, auto: true }, { type: 'moveTo', fraction: 0.57 });

    expect(scanReducer(moved, { type: 'sweep', fraction: 0.21 })).toBe(moved);
  });

  it('clamps positions to the model', () => {
    expect(scanReducer({ scan: 0.2, auto: false }, { type: 'moveTo', fraction: 1.4 }).scan).toBe(1);
    expect(scanReducer({ scan: 0.2, auto: true }, { type: 'sweep', fraction: -0.3 }).scan).toBe(0);
  });

  it('switches the sweep on and off without moving the plane', () => {
    expect(scanReducer({ scan: 0.4, auto: false }, { type: 'setAuto', auto: true })).toEqual({ scan: 0.4, auto: true });
  });
});
