import { describe, expect, it } from 'vitest';

import { fieldIntegrityIndex, findingsBySeverity, integritySummary, integrityTone, rankByRisk, riskScore, worstSeverity, type IntegrityRecord } from './integrity';

const CLEAR: IntegrityRecord = { pressure: 198, temperature: 64, inspectedDaysAgo: 41, remainingLife: 24, findings: [] };
const WORN: IntegrityRecord = { pressure: 132, temperature: 48, inspectedDaysAgo: 28, remainingLife: 9, findings: [{ text: 'Sheath wear', severity: 'low', foundDaysAgo: 28 }] };
const CORRODED: IntegrityRecord = {
  pressure: 144,
  temperature: 57,
  inspectedDaysAgo: 203,
  remainingLife: 7,
  findings: [
    { text: 'Wall loss', severity: 'high', foundDaysAgo: 203 },
    { text: 'Buckle', severity: 'medium', foundDaysAgo: 203 },
  ],
};

describe('integrity', () => {
  it('finds the worst open finding', () => {
    expect(worstSeverity(CLEAR)).toBeNull();
    expect(worstSeverity(WORN)).toBe('low');
    expect(worstSeverity(CORRODED)).toBe('high');
  });

  it('gives an asset the tone of its worst finding or its short life', () => {
    expect(integrityTone(CLEAR)).toBe('success');
    expect(integrityTone(WORN)).toBe('warning');
    expect(integrityTone({ ...WORN, remainingLife: 20 })).toBe('info');
    expect(integrityTone(CORRODED)).toBe('critical');
  });

  it('summarises the findings in words', () => {
    expect(integritySummary(CLEAR)).toBe('No open findings');
    expect(integritySummary(WORN)).toBe('1 open finding, worst low');
    expect(integritySummary(CORRODED)).toBe('2 open findings, worst high');
  });

  it('scores risk from findings and used-up life', () => {
    expect(riskScore(CLEAR)).toBe(6);
    expect(riskScore(CORRODED)).toBe(22 + 9 + 23);
  });

  it('ranks assets by risk and keeps the given order on ties', () => {
    const records = { a: CLEAR, b: CORRODED, c: WORN, d: CLEAR };
    expect(rankByRisk(records, ['a', 'b', 'c', 'd', 'missing'])).toEqual(['b', 'c', 'a', 'd', 'missing']);
  });

  it('counts findings per severity for the field', () => {
    expect(findingsBySeverity([CLEAR, WORN, CORRODED])).toEqual([
      { severity: 'critical', count: 0 },
      { severity: 'high', count: 1 },
      { severity: 'medium', count: 1 },
      { severity: 'low', count: 1 },
    ]);
  });

  it('turns findings into a field index', () => {
    expect(fieldIntegrityIndex([])).toBe(100);
    expect(fieldIntegrityIndex([CLEAR])).toBe(100);
    expect(fieldIntegrityIndex([CLEAR, WORN, CORRODED])).toBe(Math.round(100 - 34 / 3));
  });
});
