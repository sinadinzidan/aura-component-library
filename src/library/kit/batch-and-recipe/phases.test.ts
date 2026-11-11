import { phaseTone, type TrackPhase } from './phases';

const phase = (state: TrackPhase['state'], actual: number | null): TrackPhase => ({ id: 'p', label: 'Heat', expected: 40, actual, state });

describe(phaseTone.name, () => {
  it('reads held, running and upcoming phases from their state', () => {
    expect(phaseTone(phase('held', 20))).toBe('warning');
    expect(phaseTone(phase('current', 20))).toBe('info');
    expect(phaseTone(phase('upcoming', null))).toBe('neutral');
  });

  it('turns a finished phase to warning only past a tenth over the recipe', () => {
    expect(phaseTone(phase('done', 44))).toBe('success');
    expect(phaseTone(phase('done', 46))).toBe('warning');
  });
});
