import { compareSettings, replayAlarmCount } from './replayAlarmCount';

describe(replayAlarmCount.name, () => {
  it('counts nothing when the value never reaches the limit', () => {
    expect(replayAlarmCount([1, 2, 3, 2, 1], { limit: 5 })).toEqual({ count: 0, activations: [], activeSamples: 0 });
  });

  it('counts one activation for one excursion, however long it lasts', () => {
    const result = replayAlarmCount([1, 6, 7, 8, 6, 1], { limit: 5 });

    expect(result).toEqual({ count: 1, activations: [1], activeSamples: 4 });
  });

  it('raises the alarm at the limit itself', () => {
    expect(replayAlarmCount([4, 5, 4], { limit: 5 }).count).toBe(1);
  });

  it('counts every crossing of a chattering signal without a deadband', () => {
    expect(replayAlarmCount([4, 6, 4, 6, 4, 6, 4], { limit: 5 }).count).toBe(3);
  });

  it('holds a chattering alarm as one activation with a deadband', () => {
    const result = replayAlarmCount([4, 6, 4, 6, 4, 6, 2], { limit: 5, deadband: 2 });

    expect(result.count).toBe(1);
    expect(result.activeSamples).toBe(5);
  });

  it('ignores a spike shorter than the on-delay', () => {
    expect(replayAlarmCount([1, 6, 1, 6, 6, 1], { limit: 5, onDelay: 2 }).count).toBe(0);
  });

  it('raises the alarm once the value has been beyond the limit for longer than the on-delay', () => {
    const result = replayAlarmCount([1, 6, 6, 6, 1], { limit: 5, onDelay: 2 });

    expect(result.activations).toEqual([3]);
  });

  it('bridges a short return to normal with an off-delay', () => {
    expect(replayAlarmCount([6, 1, 6, 1, 6, 1, 1, 1], { limit: 5, offDelay: 1 }).count).toBe(1);
  });

  it('alarms at or below the limit for a low alarm', () => {
    const result = replayAlarmCount([12, 10, 9, 12, 8, 12], { limit: 10, direction: 'low' });

    expect(result.activations).toEqual([1, 4]);
  });

  it('applies the deadband above the limit for a low alarm', () => {
    expect(replayAlarmCount([9, 10.5, 9, 10.5, 12], { limit: 10, direction: 'low', deadband: 1 }).count).toBe(1);
  });

  it('keeps the state through gaps in the data', () => {
    const result = replayAlarmCount([6, null, null, 6, 1], { limit: 5 });

    expect(result).toEqual({ count: 1, activations: [0], activeSamples: 4 });
  });

  it('returns an empty result for no data', () => {
    expect(replayAlarmCount([], { limit: 5 })).toEqual({ count: 0, activations: [], activeSamples: 0 });
  });
});

describe(compareSettings.name, () => {
  const values = [4, 6, 4, 6, 4, 6, 4, 9, 4];

  it('reports how many activations the proposal avoids', () => {
    const comparison = compareSettings(values, { limit: 5 }, { limit: 8 });

    expect(comparison.current.count).toBe(4);
    expect(comparison.proposed.count).toBe(1);
    expect(comparison.avoided).toBe(3);
    expect(comparison.reductionPercent).toBe(75);
  });

  it('reports a negative figure when the proposal alarms more often', () => {
    expect(compareSettings(values, { limit: 8 }, { limit: 5 }).avoided).toBe(-3);
  });

  it('has no percentage when the current setting never fired', () => {
    expect(compareSettings([1, 2, 3], { limit: 5 }, { limit: 4 }).reductionPercent).toBeNull();
  });
});
