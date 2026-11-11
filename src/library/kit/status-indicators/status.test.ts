import { HEALTH_STATES, QUALITY_STATES, RUN_STATES, SEVERITY_STATES, tally, worst } from './status';

describe('status vocabularies', () => {
  it('gives every state of a vocabulary its own shape', () => {
    for (const vocabulary of [RUN_STATES, HEALTH_STATES, QUALITY_STATES, SEVERITY_STATES]) {
      const shapes = Object.values(vocabulary).map((state) => state.shape);
      expect(new Set(shapes).size).toBe(shapes.length);
    }
  });

  it('counts states worst first', () => {
    const counted = tally([RUN_STATES.running, RUN_STATES.tripped, RUN_STATES.running, RUN_STATES.standby]);

    expect(counted.map((entry) => [entry.label, entry.count])).toEqual([
      ['Tripped', 1],
      ['Standby', 1],
      ['Running', 2],
    ]);
  });

  it('finds the worst state of a group', () => {
    expect(worst([HEALTH_STATES.good, HEALTH_STATES.poor, HEALTH_STATES.watch])?.label).toBe('Poor');
    expect(worst([])).toBeUndefined();
  });
});
