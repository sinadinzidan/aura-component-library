import { PERMIT_STATES, gasReadingTone, permitStatus, riskRating, validityShare } from './permits';

describe('permits', () => {
  it('gives every permit state a word and a tone', () => {
    for (const state of PERMIT_STATES) expect(permitStatus(state).label.length).toBeGreaterThan(0);
    expect(permitStatus('suspended')).toEqual({ label: 'Suspended', tone: 'warning' });
  });

  it('clamps the share of a validity window', () => {
    expect(validityShare(0, 100, 25)).toBe(0.25);
    expect(validityShare(0, 100, 250)).toBe(1);
    expect(validityShare(0, 100, -5)).toBe(0);
    expect(validityShare(10, 10, 5)).toBe(1);
  });

  it('bands a risk score', () => {
    expect(riskRating(1, 3)).toMatchObject({ score: 3, label: 'Low' });
    expect(riskRating(2, 3)).toMatchObject({ label: 'Medium' });
    expect(riskRating(3, 4)).toMatchObject({ label: 'High' });
    expect(riskRating(4, 5)).toMatchObject({ label: 'Extreme', tone: 'critical' });
  });

  it('judges a gas reading against its window', () => {
    expect(gasReadingTone(20.9, { low: 19.5, high: 23.5 })).toBe('success');
    expect(gasReadingTone(18.9, { low: 19.5, high: 23.5 })).toBe('critical');
    expect(gasReadingTone(2, { high: 10 })).toBe('success');
    expect(gasReadingTone(9, { high: 10 })).toBe('warning');
    expect(gasReadingTone(12, { high: 10 })).toBe('critical');
  });
});
