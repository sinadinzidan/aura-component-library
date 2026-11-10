import { alarmStateLabel, countBySeverity, isOpenAlarm, sortAlarmsBySeverity, worstSeverity } from './alarms';

describe('alarms', () => {
  it('sorts the most severe alarm first', () => {
    const sorted = sortAlarmsBySeverity([
      { severity: 'low', raisedAt: 5 },
      { severity: 'critical', raisedAt: 1 },
      { severity: 'high', raisedAt: 3 },
    ]);

    expect(sorted.map((alarm) => alarm.severity)).toEqual(['critical', 'high', 'low']);
  });

  it('puts the newest alarm first within one severity', () => {
    const sorted = sortAlarmsBySeverity([
      { severity: 'high', raisedAt: 10 },
      { severity: 'high', raisedAt: 30 },
    ]);

    expect(sorted.map((alarm) => alarm.raisedAt)).toEqual([30, 10]);
  });

  it('does not mutate the list it sorts', () => {
    const alarms = [
      { severity: 'low', raisedAt: 1 },
      { severity: 'critical', raisedAt: 2 },
    ] as const;

    sortAlarmsBySeverity(alarms);

    expect(alarms[0].severity).toBe('low');
  });

  it('counts every severity, including the ones with no alarms', () => {
    expect(countBySeverity([{ severity: 'high' }, { severity: 'high' }, { severity: 'low' }])).toEqual({
      critical: 0,
      high: 2,
      medium: 0,
      low: 1,
    });
  });

  it('treats active and acknowledged alarms as open', () => {
    expect(isOpenAlarm({ state: 'active' })).toBe(true);
    expect(isOpenAlarm({ state: 'acknowledged' })).toBe(true);
    expect(isOpenAlarm({ state: 'shelved' })).toBe(false);
    expect(isOpenAlarm({ state: 'cleared' })).toBe(false);
  });

  it('names an active alarm by what it still needs', () => {
    expect(alarmStateLabel('active')).toBe('Unacknowledged');
  });

  it('finds the worst severity, or none for an empty list', () => {
    expect(worstSeverity(['low', 'high', 'medium'])).toBe('high');
    expect(worstSeverity([])).toBeUndefined();
  });
});
