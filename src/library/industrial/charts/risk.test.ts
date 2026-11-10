import { countByRiskLevel, riskLevel } from './risk';
import type { RiskItem } from './risk';

const ITEMS: readonly RiskItem[] = [
  { id: 'a', label: 'Recompressor', likelihood: 4, consequence: 5 },
  { id: 'b', label: 'Interstage cooler', likelihood: 3, consequence: 3 },
  { id: 'c', label: 'Cooling water pump', likelihood: 3, consequence: 3 },
  { id: 'd', label: 'Test separator', likelihood: 1, consequence: 2 },
];

describe(riskLevel.name, () => {
  it('grades the score against the thresholds', () => {
    expect(riskLevel(1, 4)).toBe('low');
    expect(riskLevel(1, 5)).toBe('medium');
    expect(riskLevel(3, 5)).toBe('high');
  });

  it('accepts other thresholds', () => {
    expect(riskLevel(2, 2, { medium: 4, high: 9 })).toBe('medium');
  });
});

describe(countByRiskLevel.name, () => {
  it('counts items per level', () => {
    expect(countByRiskLevel(ITEMS)).toEqual({ low: 1, medium: 2, high: 1 });
  });
});
