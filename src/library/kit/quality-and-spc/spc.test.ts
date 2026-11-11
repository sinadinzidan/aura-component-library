import { axisTicks, capability, histogramBins, normalShare, runRules, specText, specVerdict } from './spc';

describe(runRules.name, () => {
  it('flags a point beyond a control limit under rule 1', () => {
    expect(runRules([10, 10.2, 13.1, 9.9], 10, 12, 8)).toEqual([{ index: 2, rule: 1, text: 'Beyond a control limit' }]);
  });

  it('flags the eighth and later points of a run on one side', () => {
    const flags = runRules([10.5, 10.2, 10.4, 10.1, 10.3, 10.2, 10.4, 10.1, 10.3, 9.8], 10, 12, 8);

    expect(flags.map((flag) => [flag.index, flag.rule])).toEqual([
      [7, 2],
      [8, 2],
    ]);
  });

  it('flags six points in a row moving the same way', () => {
    const flags = runRules([10, 9.6, 9.8, 10, 10.2, 10.4, 10.6, 10.1], 10, 12, 8);

    expect(flags.map((flag) => [flag.index, flag.rule])).toEqual([[6, 3]]);
  });

  it('returns nothing for a stable process', () => {
    expect(runRules([10.1, 9.9, 10.2, 9.8, 10, 10.1, 9.9], 10, 12, 8)).toEqual([]);
  });
});

describe(capability.name, () => {
  it('computes Cp and Cpk', () => {
    const result = capability([9, 10, 11], 7, 13);

    expect(result.mean).toBe(10);
    expect(result.sigma).toBe(1);
    expect(result.cp).toBe(1);
    expect(result.cpk).toBe(1);
  });

  it('lowers Cpk when the process is off centre', () => {
    const result = capability([10, 11, 12], 7, 13);

    expect(result.cp).toBe(1);
    expect(result.cpk).toBeCloseTo(0.667, 3);
  });
});

describe(histogramBins.name, () => {
  it('counts values per bin and keeps outliers in the end bins', () => {
    expect(histogramBins([0.1, 0.9, 1.5, 2.5, 9], 0, 3, 3)).toEqual([2, 1, 2]);
  });
});

describe(normalShare.name, () => {
  it('peaks at the mean', () => {
    expect(normalShare(5, 5, 1)).toBe(1);
    expect(normalShare(6, 5, 1)).toBeCloseTo(0.6065, 4);
  });
});

describe(specVerdict.name, () => {
  it('judges against one- and two-sided limits', () => {
    expect(specVerdict(1.2, 0.5, 2)).toEqual({ word: 'In spec', ok: true });
    expect(specVerdict(2.4, undefined, 2)).toEqual({ word: 'Above spec', ok: false });
    expect(specVerdict(0.2, 0.5)).toEqual({ word: 'Below spec', ok: false });
  });
});

describe(specText.name, () => {
  it('writes the specification in words', () => {
    const format = (value: number) => value.toFixed(1);
    expect(specText(format, 0.5, 2)).toBe('0.5 – 2.0');
    expect(specText(format, undefined, 2)).toBe('max 2.0');
    expect(specText(format, 0.5)).toBe('min 0.5');
    expect(specText(format)).toBe('none');
  });
});

describe(axisTicks.name, () => {
  it('returns round ticks inside the domain', () => {
    expect(axisTicks(3.9, 4.7)).toEqual([4, 4.2, 4.4, 4.6]);
    expect(axisTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
  });
});
