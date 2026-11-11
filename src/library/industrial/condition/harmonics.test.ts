import {
  bandLevel,
  bandLevels,
  findPeakIndices,
  findPeaks,
  harmonicFamily,
  lineIndexAt,
  maskExceedances,
  maskLimitAt,
  peakNear,
  toAccelerationSpectrum,
  toOrders,
  velocityToAcceleration,
} from './harmonics';

const spectrum = [0, 1, 5, 1, 0.5, 3, 0.4, 0.2].map((amplitude, index) => ({ frequencyHz: index * 10, amplitude }));

describe('harmonicFamily', () => {
  it('lists multiples with order labels', () => {
    expect(harmonicFamily(25)).toEqual([
      { order: 1, frequencyHz: 25, label: '1×' },
      { order: 2, frequencyHz: 50, label: '2×' },
      { order: 3, frequencyHz: 75, label: '3×' },
    ]);
  });

  it('names a family and stops at the maximum', () => {
    expect(harmonicFamily(30, { name: 'BPFO', count: 5, maxHz: 100 }).map((cursor) => cursor.label)).toEqual(['BPFO', '2 BPFO', '3 BPFO']);
  });

  it('returns nothing for a non-positive fundamental', () => {
    expect(harmonicFamily(0)).toEqual([]);
  });
});

describe('orders and lookup', () => {
  it('converts frequency to orders', () => {
    expect(toOrders(100, 50)).toBe(2);
    expect(toOrders(100, 0)).toBe(0);
  });

  it('finds the nearest line', () => {
    expect(lineIndexAt(spectrum, 22)).toBe(2);
    expect(lineIndexAt([], 5)).toBe(-1);
  });

  it('finds the highest line near a frequency', () => {
    expect(peakNear(spectrum, 22, 12)?.amplitude).toBe(5);
    expect(peakNear(spectrum, 200, 5)).toBeNull();
  });
});

describe('peaks', () => {
  it('finds local maxima, highest first, never at 0 Hz', () => {
    expect(findPeakIndices(spectrum)).toEqual([2, 5]);
  });

  it('applies the threshold and the limit', () => {
    expect(findPeaks(spectrum, { threshold: 4 })).toEqual([spectrum[2]]);
    expect(findPeaks(spectrum, { limit: 1 })).toHaveLength(1);
  });

  it('treats the last line as a peak when it is higher than its neighbour', () => {
    expect(findPeakIndices([{ frequencyHz: 0, amplitude: 0 }, { frequencyHz: 1, amplitude: 1 }, { frequencyHz: 2, amplitude: 2 }])).toEqual([2]);
  });
});

describe('band levels', () => {
  it('sums line power inside the band', () => {
    const lines = [{ frequencyHz: 10, amplitude: 3 }, { frequencyHz: 20, amplitude: 4 }, { frequencyHz: 30, amplitude: 9 }];
    expect(bandLevel(lines, 0, 25, 'rectangular')).toBeCloseTo(5);
    expect(bandLevel(lines, 0, 25)).toBeCloseTo(5 / Math.sqrt(1.5));
  });

  it('flags a band above its alarm', () => {
    const levels = bandLevels(spectrum, [{ id: 'low', label: 'Low', fromHz: 0, toHz: 30, alarm: 2 }, { id: 'high', label: 'High', fromHz: 30, toHz: 80 }], 'rectangular');
    expect(levels[0].exceeded).toBe(true);
    expect(levels[1].exceeded).toBe(false);
  });
});

describe('alarm mask', () => {
  const mask = [{ fromHz: 0, toHz: 40, limit: 2 }, { fromHz: 40, toHz: 80, limit: 1 }];

  it('looks up the limit at a frequency', () => {
    expect(maskLimitAt(mask, 10)).toBe(2);
    expect(maskLimitAt(mask, 40)).toBe(1);
    expect(maskLimitAt(mask, 90)).toBeNull();
  });

  it('lists the lines that break through', () => {
    expect(maskExceedances(spectrum, mask).map((line) => line.frequencyHz)).toEqual([20, 50]);
  });
});

describe('acceleration conversion', () => {
  it('converts mm/s at a frequency to g', () => {
    expect(velocityToAcceleration(10, 100)).toBeCloseTo((2 * Math.PI * 100 * 10) / 1000 / 9.80665);
    expect(velocityToAcceleration(10, 0)).toBe(0);
  });

  it('keeps frequencies and weights high lines more', () => {
    const converted = toAccelerationSpectrum([{ frequencyHz: 10, amplitude: 1 }, { frequencyHz: 100, amplitude: 1 }]);
    expect(converted[0].frequencyHz).toBe(10);
    expect(converted[1].amplitude).toBeCloseTo(converted[0].amplitude * 10);
  });
});
