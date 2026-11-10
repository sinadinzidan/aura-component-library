import { tapeBands, tapeBug, tapeOffset, tapeTicks } from './tapeScale';

describe('tapeOffset', () => {
  it('is zero at the pointer', () => {
    expect(tapeOffset(48, 48, 20)).toBe(0);
  });

  it('is half a window at the ends', () => {
    expect(tapeOffset(58, 48, 20)).toBe(0.5);
    expect(tapeOffset(38, 48, 20)).toBe(-0.5);
  });

  it('is zero for an empty window', () => {
    expect(tapeOffset(10, 5, 0)).toBe(0);
  });
});

describe('tapeTicks', () => {
  it('lists the ticks inside the window, lowest first', () => {
    const ticks = tapeTicks({ value: 50, span: 20, majorStep: 10, minorPerMajor: 2 });

    expect(ticks.map((tick) => tick.value)).toEqual([40, 45, 50, 55, 60]);
  });

  it('marks every nth tick as major', () => {
    const ticks = tapeTicks({ value: 50, span: 20, majorStep: 10, minorPerMajor: 2 });

    expect(ticks.filter((tick) => tick.major).map((tick) => tick.value)).toEqual([40, 50, 60]);
  });

  it('moves the ticks as the value moves', () => {
    const [first] = tapeTicks({ value: 52.5, span: 20, majorStep: 10, minorPerMajor: 2 });

    expect(first).toEqual({ value: 45, offset: -0.375, major: false });
  });

  it('keeps decimal steps exact', () => {
    const ticks = tapeTicks({ value: 0.3, span: 0.4, majorStep: 0.1, minorPerMajor: 1 });

    expect(ticks.map((tick) => tick.value)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it('stops at the ends of the scale', () => {
    const ticks = tapeTicks({ value: 2, span: 20, majorStep: 5, minorPerMajor: 1, min: 0, max: 60 });

    expect(ticks.map((tick) => tick.value)).toEqual([0, 5, 10]);
  });

  it('returns nothing for an invalid scale', () => {
    expect(tapeTicks({ value: 10, span: 0, majorStep: 5 })).toEqual([]);
    expect(tapeTicks({ value: 10, span: 20, majorStep: 0 })).toEqual([]);
    expect(tapeTicks({ value: Number.NaN, span: 20, majorStep: 5 })).toEqual([]);
  });
});

describe('tapeBands', () => {
  it('clips zones to the window', () => {
    const bands = tapeBands(
      [
        { from: 0, to: 52, tone: 'neutral' },
        { from: 52, to: 55, tone: 'warning' },
        { from: 55, to: 60, tone: 'critical' },
      ],
      50,
      10
    );

    expect(bands).toEqual([
      { from: -0.5, to: 0.2, tone: 'neutral' },
      { from: 0.2, to: 0.5, tone: 'warning' },
    ]);
  });
});

describe('tapeBug', () => {
  it('sits at the setpoint inside the window', () => {
    expect(tapeBug(49, 48, 20)).toEqual({ offset: 0.05, pinned: null });
  });

  it('pins to the high end when the setpoint is above the window', () => {
    expect(tapeBug(90, 48, 20)).toEqual({ offset: 0.5, pinned: 'high' });
  });

  it('pins to the low end when the setpoint is below the window', () => {
    expect(tapeBug(10, 48, 20)).toEqual({ offset: -0.5, pinned: 'low' });
  });
});
