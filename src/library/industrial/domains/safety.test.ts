import {
  barrierStatus,
  countBarrierStates,
  gasReadingTone,
  permitStatus,
  riskLevel,
  riskScore,
  riskStatus,
  worstBarrierState,
} from './safety';

describe(permitStatus.name, () => {
  it('shows only an active permit as success', () => {
    expect(permitStatus('active')).toEqual({ tone: 'success', label: 'Active', shape: 'dot' });
  });

  it('shows a suspended permit as a warning', () => {
    expect(permitStatus('suspended')).toMatchObject({ tone: 'warning', label: 'Suspended' });
  });

  it('keeps requested and closed permits neutral', () => {
    expect(permitStatus('requested').tone).toBe('neutral');
    expect(permitStatus('closed').tone).toBe('neutral');
  });
});

describe(barrierStatus.name, () => {
  it('gives each state its own shape', () => {
    const shapes = (['healthy', 'degraded', 'impaired'] as const).map((state) => barrierStatus(state).shape);

    expect(new Set(shapes).size).toBe(3);
  });

  it('shows an impaired barrier as critical', () => {
    expect(barrierStatus('impaired')).toMatchObject({ tone: 'critical', label: 'Impaired' });
  });
});

describe(riskScore.name, () => {
  it('multiplies likelihood by consequence', () => {
    expect(riskScore(3, 4)).toBe(12);
  });
});

describe(riskLevel.name, () => {
  it.each([
    [1, 1, 'low'],
    [2, 2, 'low'],
    [1, 5, 'medium'],
    [3, 3, 'medium'],
    [2, 5, 'high'],
    [4, 4, 'high'],
    [4, 5, 'extreme'],
    [5, 5, 'extreme'],
  ] as const)('rates likelihood %s and consequence %s as %s', (likelihood, consequence, level) => {
    expect(riskLevel(likelihood, consequence)).toBe(level);
  });

  it('is symmetric', () => {
    expect(riskLevel(2, 5)).toBe(riskLevel(5, 2));
  });
});

describe(riskStatus.name, () => {
  it('shows extreme risk as critical', () => {
    expect(riskStatus('extreme')).toMatchObject({ tone: 'critical', label: 'Extreme' });
  });
});

describe(worstBarrierState.name, () => {
  it('is impaired when any barrier is impaired', () => {
    expect(worstBarrierState(['healthy', 'degraded', 'impaired'])).toBe('impaired');
  });

  it('is degraded when the worst barrier is degraded', () => {
    expect(worstBarrierState(['healthy', 'degraded'])).toBe('degraded');
  });

  it('is healthy for an empty list', () => {
    expect(worstBarrierState([])).toBe('healthy');
  });
});

describe(countBarrierStates.name, () => {
  it('counts each state', () => {
    expect(countBarrierStates(['healthy', 'healthy', 'degraded'])).toEqual({ healthy: 2, degraded: 1, impaired: 0 });
  });
});

describe(gasReadingTone.name, () => {
  it('is neutral inside the oxygen window', () => {
    expect(gasReadingTone(20.9, { min: 19.5, max: 23.5 })).toBe('neutral');
  });

  it('is critical at or below the minimum', () => {
    expect(gasReadingTone(19.5, { min: 19.5, max: 23.5 })).toBe('critical');
  });

  it('is critical at or above the maximum', () => {
    expect(gasReadingTone(10, { max: 10 })).toBe('critical');
  });

  it('is neutral below a ceiling', () => {
    expect(gasReadingTone(0, { max: 10 })).toBe('neutral');
  });
});
