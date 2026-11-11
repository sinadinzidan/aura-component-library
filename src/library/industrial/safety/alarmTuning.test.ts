import { SIGNAL_TYPES, delayInSamples, suggestTuning } from './alarmTuning';

describe(suggestTuning.name, () => {
  it('suggests 2% of span and 15 s for a pressure signal', () => {
    expect(suggestTuning('pressure', 60)).toEqual({ deadbandPercent: 2, deadband: 1.2, delaySeconds: 15 });
  });

  it('suggests 1% of span and 60 s for a temperature signal', () => {
    expect(suggestTuning('temperature', 180)).toEqual({ deadbandPercent: 1, deadband: 1.8, delaySeconds: 60 });
  });

  it('suggests 5% of span for flow and level, with a longer delay for level', () => {
    expect(suggestTuning('flow', 600)).toMatchObject({ deadband: 30, delaySeconds: 15 });
    expect(suggestTuning('level', 100)).toMatchObject({ deadband: 5, delaySeconds: 60 });
  });

  it('never returns a negative deadband', () => {
    for (const type of SIGNAL_TYPES) expect(suggestTuning(type, -10).deadband).toBe(0);
  });
});

describe(delayInSamples.name, () => {
  it('converts a delay to whole samples', () => {
    expect(delayInSamples(60, 10)).toBe(6);
    expect(delayInSamples(15, 10)).toBe(1);
  });

  it('returns 0 for a delay shorter than one sample or a bad interval', () => {
    expect(delayInSamples(5, 10)).toBe(0);
    expect(delayInSamples(60, 0)).toBe(0);
  });
});
