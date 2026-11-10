import { complianceRate, judgeCompliance } from './compliance';

describe(judgeCompliance.name, () => {
  it('is within an upper limit with room to spare', () => {
    expect(judgeCompliance(0.3, { max: 1 })).toMatchObject({ verdict: 'within', tone: 'success', label: 'Within limit' });
  });

  it('is close when less than a tenth of the limit is left', () => {
    expect(judgeCompliance(0.95, { max: 1 })).toMatchObject({ verdict: 'close', tone: 'warning', label: 'Close to limit' });
  });

  it('is exceeded above an upper limit', () => {
    const result = judgeCompliance(1.2, { max: 1 });

    expect(result).toMatchObject({ verdict: 'exceeded', tone: 'critical', label: 'Limit exceeded' });
    expect(result.margin).toBeCloseTo(-0.2, 6);
  });

  it('judges a lower limit', () => {
    expect(judgeCompliance(0.15, { min: 0.2 }).verdict).toBe('exceeded');
    expect(judgeCompliance(0.21, { min: 0.2 }).verdict).toBe('close');
    expect(judgeCompliance(0.5, { min: 0.2 }).verdict).toBe('within');
  });

  it('uses the nearest limit of a band', () => {
    const result = judgeCompliance(9.3, { min: 6.5, max: 9.5 });

    expect(result.verdict).toBe('close');
    expect(result.margin).toBeCloseTo(0.2, 6);
  });

  it('is exactly on the limit and still compliant', () => {
    expect(judgeCompliance(1, { max: 1 }).verdict).toBe('close');
  });

  it('takes a custom warning share', () => {
    expect(judgeCompliance(0.7, { max: 1 }, 0.4).verdict).toBe('close');
  });

  it('has nothing to judge without a limit', () => {
    expect(judgeCompliance(5, {})).toMatchObject({ verdict: 'within', margin: null });
  });
});

describe(complianceRate.name, () => {
  it('is compliant samples over all samples', () => {
    expect(complianceRate(358, 360)).toBeCloseTo(99.44, 2);
  });

  it('is null with no samples', () => {
    expect(complianceRate(0, 0)).toBeNull();
  });

  it('never exceeds 100', () => {
    expect(complianceRate(12, 10)).toBe(100);
  });
});
