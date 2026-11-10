import {
  computeDelta,
  deltaTone,
  describeReading,
  formatDelta,
  formatReading,
  formatValue,
  healthStatus,
  qualityStatus,
  runStateStatus,
  severityStatus,
  toneFromLimits,
  toneFromZones,
  zonesFromLimits,
} from './status';

describe(toneFromLimits.name, () => {
  const limits = { lowLow: 5, low: 10, high: 52, highHigh: 55 };

  it('is neutral inside the operating limits', () => {
    expect(toneFromLimits(48.6, limits)).toBe('neutral');
  });

  it('uses the given normal tone inside the limits', () => {
    expect(toneFromLimits(48.6, limits, 'success')).toBe('success');
  });

  it('is neutral exactly on the high limit', () => {
    expect(toneFromLimits(52, limits)).toBe('neutral');
  });

  it('is warning above high and below low', () => {
    expect(toneFromLimits(53, limits)).toBe('warning');
    expect(toneFromLimits(9, limits)).toBe('warning');
  });

  it('is critical at or beyond a trip limit', () => {
    expect(toneFromLimits(55, limits)).toBe('critical');
    expect(toneFromLimits(4, limits)).toBe('critical');
  });

  it('ignores limits that are not set', () => {
    expect(toneFromLimits(1000, {})).toBe('neutral');
  });
});

describe(zonesFromLimits.name, () => {
  it('builds contiguous zones from all four limits', () => {
    expect(zonesFromLimits(0, 60, { lowLow: 5, low: 10, high: 52, highHigh: 55 })).toEqual([
      { from: 0, to: 5, tone: 'critical' },
      { from: 5, to: 10, tone: 'warning' },
      { from: 10, to: 52, tone: 'neutral' },
      { from: 52, to: 55, tone: 'warning' },
      { from: 55, to: 60, tone: 'critical' },
    ]);
  });

  it('ends in a warning zone when there is no trip limit', () => {
    expect(zonesFromLimits(0, 20, { high: 15 })).toEqual([
      { from: 0, to: 15, tone: 'neutral' },
      { from: 15, to: 20, tone: 'warning' },
    ]);
  });

  it('is one neutral zone without limits', () => {
    expect(zonesFromLimits(0, 100, {})).toEqual([{ from: 0, to: 100, tone: 'neutral' }]);
  });

  it('ignores limits outside the range', () => {
    expect(zonesFromLimits(0, 15, { low: 0, high: 7.1, highHigh: 20 })).toEqual([
      { from: 0, to: 7.1, tone: 'neutral' },
      { from: 7.1, to: 15, tone: 'warning' },
    ]);
  });
});

describe(toneFromZones.name, () => {
  const zones = zonesFromLimits(0, 60, { high: 52, highHigh: 55 });

  it('returns the tone of the zone the value is in', () => {
    expect(toneFromZones(40, zones)).toBe('neutral');
    expect(toneFromZones(53, zones)).toBe('warning');
    expect(toneFromZones(56, zones)).toBe('critical');
  });

  it('keeps the last zone tone at and above the top of the scale', () => {
    expect(toneFromZones(60, zones)).toBe('critical');
  });

  it('is neutral when there are no zones', () => {
    expect(toneFromZones(5, [])).toBe('neutral');
  });
});

describe(formatValue.name, () => {
  it('pads to the given decimals', () => {
    expect(formatValue(48.6, 2)).toBe('48.60');
  });

  it('groups thousands', () => {
    expect(formatValue(182400)).toBe('182,400');
  });

  it('uses a real minus sign', () => {
    expect(formatValue(-1.25, 1)).toBe('\u22121.3');
  });

  it('does not sign a value that rounds to zero', () => {
    expect(formatValue(-0.01, 1)).toBe('0.0');
  });

  it('shows an em dash for missing values', () => {
    expect(formatValue(null)).toBe('\u2014');
    expect(formatValue(undefined)).toBe('\u2014');
    expect(formatValue(Number.NaN)).toBe('\u2014');
  });
});

describe(formatDelta.name, () => {
  it('signs a rise with plus', () => {
    expect(formatDelta(0.8, 1)).toBe('+0.8');
  });

  it('signs a fall with a real minus', () => {
    expect(formatDelta(-0.7, 1)).toBe('\u22120.7');
  });

  it('leaves zero unsigned', () => {
    expect(formatDelta(0.04, 1)).toBe('0.0');
  });

  it('shows an em dash without a value', () => {
    expect(formatDelta(null, 1)).toBe('\u2014');
  });
});

describe(formatReading.name, () => {
  it('joins value and unit with a non-breaking space', () => {
    expect(formatReading(48.6, 'barg', 1)).toBe('48.6\u00a0barg');
  });

  it('omits the unit when there is no value', () => {
    expect(formatReading(null, 'barg', 1)).toBe('\u2014');
  });
});

describe(computeDelta.name, () => {
  it('returns the absolute difference', () => {
    expect(computeDelta(96.4, 97.1)).toBeCloseTo(-0.7);
  });

  it('returns the percent change against the reference', () => {
    expect(computeDelta(110, 100, 'percent')).toBeCloseTo(10);
  });

  it('has no percent change from zero', () => {
    expect(computeDelta(4, 0, 'percent')).toBeNull();
  });
});

describe(deltaTone.name, () => {
  it('treats a rise as good when up is good', () => {
    expect(deltaTone(1, 'up')).toBe('success');
    expect(deltaTone(-1, 'up')).toBe('critical');
  });

  it('treats a fall as good when down is good', () => {
    expect(deltaTone(-1, 'down')).toBe('success');
    expect(deltaTone(1, 'down')).toBe('critical');
  });

  it('makes no judgement without a direction or a change', () => {
    expect(deltaTone(1)).toBe('neutral');
    expect(deltaTone(0, 'up')).toBe('neutral');
  });
});

describe(describeReading.name, () => {
  it('names the reading with value and unit', () => {
    expect(describeReading('Discharge pressure', 48.6, 'barg', 1)).toBe('Discharge pressure: 48.6\u00a0barg');
  });

  it('adds the state when it is not neutral', () => {
    expect(describeReading('Vibration', 11.6, 'mm/s', 1, 'critical')).toBe('Vibration: 11.6\u00a0mm/s, critical');
  });

  it('says when there is no data', () => {
    expect(describeReading('Bearing temperature', null, '°C')).toBe('Bearing temperature: no data');
  });
});

describe('status descriptors', () => {
  it('maps run states to tone, label and shape', () => {
    expect(runStateStatus('running')).toEqual({ tone: 'success', label: 'Running', shape: 'dot' });
    expect(runStateStatus('standby')).toEqual({ tone: 'info', label: 'Standby', shape: 'ring' });
    expect(runStateStatus('stopped')).toEqual({ tone: 'neutral', label: 'Stopped', shape: 'square' });
    expect(runStateStatus('tripped')).toEqual({ tone: 'critical', label: 'Tripped', shape: 'diamond' });
    expect(runStateStatus('maintenance')).toEqual({ tone: 'warning', label: 'Maintenance', shape: 'square' });
  });

  it('maps health, signal quality and severity', () => {
    expect(healthStatus('watch').tone).toBe('warning');
    expect(healthStatus('poor').tone).toBe('critical');
    expect(qualityStatus('uncertain')).toEqual({ tone: 'warning', label: 'Uncertain', shape: 'ring' });
    expect(qualityStatus('bad').tone).toBe('critical');
    expect(severityStatus('critical').tone).toBe('critical');
    expect(severityStatus('high').tone).toBe('warning');
    expect(severityStatus('medium').tone).toBe('info');
    expect(severityStatus('low').tone).toBe('neutral');
  });
});
