import { FAULT_SIGNATURES, diagnosePeak } from './faults';

const context = { runningHz: 50, bearing: { bpfo: 178, bpfi: 272, ftf: 20 }, vanes: 5 };

describe('FAULT_SIGNATURES', () => {
  it('describes each fault with at least one labelled line', () => {
    for (const signature of Object.values(FAULT_SIGNATURES)) {
      expect(signature.lines.some((line) => line.label)).toBe(true);
      expect(Math.max(...signature.lines.map((line) => line.height))).toBe(1);
    }
  });
});

describe('diagnosePeak', () => {
  it.each([
    [50, 'unbalance', '1×'],
    [100, 'misalignment', '2×'],
    [250, 'vane-pass', 'Vane pass'],
    [178, 'bearing-outer', 'BPFO'],
    [356, 'bearing-outer', '2 BPFO'],
    [272, 'bearing-inner', 'BPFI'],
    [20, 'cage', 'FTF'],
    [25, 'looseness', '0.5×'],
  ])('matches %s Hz to %s', (frequency, faultId, name) => {
    const result = diagnosePeak(frequency, context);
    expect(result?.faultId).toBe(faultId);
    expect(result?.frequencyName).toBe(name);
  });

  it('tolerates a small offset', () => {
    expect(diagnosePeak(51, context)?.faultId).toBe('unbalance');
  });

  it('returns null when nothing is close', () => {
    expect(diagnosePeak(131, context)).toBeNull();
  });

  it('works without bearing or vane data', () => {
    expect(diagnosePeak(178, { runningHz: 50 })).toBeNull();
    expect(diagnosePeak(100, { runningHz: 50 })?.faultId).toBe('misalignment');
  });

  it('gives a cause and a next step', () => {
    const result = diagnosePeak(50, context);
    expect(result?.cause).toBe('Unbalance');
    expect(result?.nextStep.length).toBeGreaterThan(10);
  });
});
