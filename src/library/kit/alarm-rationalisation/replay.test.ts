import { replayAlarm } from './replay';

const CHATTER = [9, 11, 9.8, 11, 9.9, 11, 9.7, 11, 8, 8];

describe(replayAlarm.name, () => {
  it('counts every crossing without deadband or delay', () => {
    expect(replayAlarm(CHATTER, { limit: 10 })).toEqual({ activations: 4, standingSamples: 4 });
  });

  it('holds the alarm through small dips with a deadband', () => {
    expect(replayAlarm(CHATTER, { limit: 10, deadband: 1 })).toEqual({ activations: 1, standingSamples: 7 });
  });

  it('ignores spikes shorter than the on-delay', () => {
    expect(replayAlarm(CHATTER, { limit: 10, delaySamples: 1 }).activations).toBe(0);
    expect(replayAlarm([9, 11, 11, 11, 9], { limit: 10, delaySamples: 1 })).toEqual({ activations: 1, standingSamples: 2 });
  });

  it('raises less often with a higher limit', () => {
    expect(replayAlarm(CHATTER, { limit: 12 }).activations).toBe(0);
  });

  it('returns zeros for no data', () => {
    expect(replayAlarm([], { limit: 1 })).toEqual({ activations: 0, standingSamples: 0 });
  });
});
