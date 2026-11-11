import { DEFAULT_STAGES, describeLoading, failedAt, overallProgress, stagesAt } from './loadingStages';

describe('overallProgress', () => {
  it('is zero before the first stage and 100 when all are done', () => {
    expect(overallProgress(stagesAt(-1))).toBe(0);
    expect(overallProgress(stagesAt(DEFAULT_STAGES.length))).toBe(100);
  });

  it('counts finished stages in full and the active one by fraction', () => {
    expect(overallProgress(stagesAt(1), 0)).toBe(10);
    expect(overallProgress(stagesAt(1), 0.5)).toBe(40);
    expect(overallProgress(stagesAt(1), 1)).toBe(70);
  });

  it('clamps the fraction and survives no stages', () => {
    expect(overallProgress(stagesAt(1), 5)).toBe(70);
    expect(overallProgress([])).toBe(0);
  });
});

describe('stagesAt and failedAt', () => {
  it('marks earlier stages done, one active, the rest pending', () => {
    expect(stagesAt(2).map((stage) => stage.state)).toEqual(['done', 'done', 'active', 'pending']);
  });

  it('attaches details by stage id', () => {
    expect(stagesAt(1, { geometry: '12 of 48 files' })[1].detail).toBe('12 of 48 files');
  });

  it('marks a stage as failed with its reason', () => {
    const stages = failedAt(stagesAt(1), 'geometry', 'Connection lost');
    expect(stages[1]).toMatchObject({ state: 'error', detail: 'Connection lost' });
  });
});

describe('describeLoading', () => {
  it('says what is happening', () => {
    expect(describeLoading(stagesAt(1), 0.5)).toBe('Fetching geometry, 40 %');
    expect(describeLoading(stagesAt(DEFAULT_STAGES.length))).toBe('Model ready');
    expect(describeLoading(stagesAt(-1))).toBe('Waiting to start');
    expect(describeLoading(failedAt(stagesAt(1), 'geometry', 'x'))).toBe('Fetching geometry failed');
  });
});
