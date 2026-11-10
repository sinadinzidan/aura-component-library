import { healthFromScore, healthTone, rankByRisk, riskScore } from './health';

describe('health', () => {
  it('maps a score to good, watch or poor at the default thresholds', () => {
    expect(healthFromScore(80)).toBe('good');
    expect(healthFromScore(79)).toBe('watch');
    expect(healthFromScore(60)).toBe('watch');
    expect(healthFromScore(59)).toBe('poor');
  });

  it('uses custom thresholds', () => {
    expect(healthFromScore(85, { watch: 90, poor: 70 })).toBe('watch');
  });

  it('keeps good health neutral and colours the rest', () => {
    expect(healthTone('good')).toBe('neutral');
    expect(healthTone('watch')).toBe('warning');
    expect(healthTone('poor')).toBe('critical');
  });

  it('weights lost health by criticality', () => {
    expect(riskScore('A', 41)).toBe(177);
    expect(riskScore('C', 41)).toBe(59);
  });

  it('clamps the score to 0–100', () => {
    expect(riskScore('B', 120)).toBe(0);
    expect(riskScore('B', -10)).toBe(200);
  });

  it('ranks the highest risk first without mutating the input', () => {
    const assets = [
      { id: 'pump', criticality: 'C', healthScore: 64 },
      { id: 'recompressor', criticality: 'A', healthScore: 41 },
      { id: 'cooler', criticality: 'B', healthScore: 69 },
    ] as const;

    expect(rankByRisk(assets).map((asset) => asset.id)).toEqual(['recompressor', 'cooler', 'pump']);
    expect(assets[0].id).toBe('pump');
  });
});
