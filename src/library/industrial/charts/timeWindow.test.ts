import { advancePlayback, canShiftBack, canShiftForward, canZoom, clampWindow, nextSpeed, shiftWindow, windowEndingAt, zoomWindow } from './timeWindow';

describe(clampWindow.name, () => {
  it('leaves a window inside the bounds alone', () => {
    expect(clampWindow([10, 20], { min: 0, max: 100 })).toEqual([10, 20]);
  });

  it('pulls a window back from the future, keeping its length', () => {
    expect(clampWindow([95, 105], { max: 100 })).toEqual([90, 100]);
  });

  it('pushes a window forward from before the start, keeping its length', () => {
    expect(clampWindow([-5, 5], { min: 0 })).toEqual([0, 10]);
  });

  it('shrinks a window that is longer than the bounds', () => {
    expect(clampWindow([-50, 150], { min: 0, max: 100 })).toEqual([0, 100]);
  });
});

describe(windowEndingAt.name, () => {
  it('returns the window of the given span ending at the time', () => {
    expect(windowEndingAt(100, 30)).toEqual([70, 100]);
  });
});

describe(shiftWindow.name, () => {
  it('steps back and forward by the window length', () => {
    expect(shiftWindow([40, 60], -1)).toEqual([20, 40]);
    expect(shiftWindow([40, 60], 1)).toEqual([60, 80]);
  });

  it('steps by a fraction of the length', () => {
    expect(shiftWindow([40, 60], 1, {}, 0.5)).toEqual([50, 70]);
  });

  it('stops at the bounds', () => {
    expect(shiftWindow([85, 95], 1, { max: 100 })).toEqual([90, 100]);
    expect(shiftWindow([5, 15], -1, { min: 0 })).toEqual([0, 10]);
  });
});

describe('canShift', () => {
  it('reports whether the window has reached an edge', () => {
    expect(canShiftForward([90, 100], { max: 100 })).toBe(false);
    expect(canShiftForward([80, 90], { max: 100 })).toBe(true);
    expect(canShiftBack([0, 10], { min: 0 })).toBe(false);
    expect(canShiftBack([5, 15], { min: 0 })).toBe(true);
  });

  it('allows any move without bounds', () => {
    expect(canShiftForward([0, 10])).toBe(true);
    expect(canShiftBack([0, 10])).toBe(true);
  });
});

describe(zoomWindow.name, () => {
  it('zooms around the centre by default', () => {
    expect(zoomWindow([40, 60], 0.5)).toEqual([45, 55]);
    expect(zoomWindow([40, 60], 2)).toEqual([30, 70]);
  });

  it('keeps the end fixed when anchored there', () => {
    expect(zoomWindow([40, 60], 0.5, {}, 'end')).toEqual([50, 60]);
    expect(zoomWindow([40, 60], 2, {}, 'end')).toEqual([20, 60]);
  });

  it('respects the span limits', () => {
    expect(zoomWindow([40, 60], 0.1, { minSpanMs: 10 })).toEqual([45, 55]);
    expect(zoomWindow([40, 60], 10, { maxSpanMs: 40 })).toEqual([30, 70]);
  });

  it('stays out of the future when zooming out', () => {
    expect(zoomWindow([80, 100], 2, { max: 100 })).toEqual([60, 100]);
  });
});

describe(canZoom.name, () => {
  it('is false once the span limit is reached', () => {
    expect(canZoom([40, 60], 0.5, { minSpanMs: 20 })).toBe(false);
    expect(canZoom([40, 60], 0.5, { minSpanMs: 5 })).toBe(true);
    expect(canZoom([40, 60], 2, { maxSpanMs: 20 })).toBe(false);
  });
});

describe(advancePlayback.name, () => {
  it('advances by step times speed', () => {
    expect(advancePlayback(10, 5, 2, 100)).toBe(20);
  });

  it('stops at the end', () => {
    expect(advancePlayback(98, 5, 2, 100)).toBe(100);
  });
});

describe(nextSpeed.name, () => {
  it('cycles through the speeds and wraps', () => {
    expect(nextSpeed([1, 2, 4], 1)).toBe(2);
    expect(nextSpeed([1, 2, 4], 4)).toBe(1);
  });

  it('starts from the first speed when the current one is not listed', () => {
    expect(nextSpeed([1, 2, 4], 3)).toBe(1);
  });
});
