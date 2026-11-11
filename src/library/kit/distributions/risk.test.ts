import { countByRiskLevel, riskLevel } from './risk';

describe('risk levels', () => {
  it('grades a cell by likelihood times consequence', () => {
    expect(riskLevel(1, 3)).toBe('low');
    expect(riskLevel(2, 2)).toBe('medium');
    expect(riskLevel(2, 4)).toBe('high');
    expect(riskLevel(3, 5)).toBe('extreme');
  });

  it('counts items per level', () => {
    const items = [
      { id: 'a', label: 'R-01', likelihood: 1, consequence: 1 },
      { id: 'b', label: 'R-02', likelihood: 5, consequence: 5 },
      { id: 'c', label: 'R-03', likelihood: 4, consequence: 4 },
    ];
    expect(countByRiskLevel(items)).toEqual({ low: 1, medium: 0, high: 0, extreme: 2 });
  });
});
