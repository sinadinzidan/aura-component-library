import {
  ALARM_PRIORITIES,
  CONSEQUENCE_SEVERITIES,
  RESPONSE_CLASSES,
  alarmPriority,
  alarmPriorityStatus,
  isDistributionOnTarget,
  matrixCell,
  priorityDistribution,
  rationalise,
  responseClass,
} from './priorityMatrix';
import type { AlarmPriority } from './priorityMatrix';

const RANK: Record<AlarmPriority, number> = { none: 0, low: 1, medium: 2, high: 3 };

describe(responseClass.name, () => {
  it.each([
    [120, 'over-30'],
    [30.5, 'over-30'],
    [30, '10-to-30'],
    [10, '10-to-30'],
    [9.9, '3-to-10'],
    [3, '3-to-10'],
    [2.9, 'under-3'],
    [0, 'under-3'],
  ] as const)('puts %s min in %s', (minutes, expected) => {
    expect(responseClass(minutes)).toBe(expected);
  });
});

describe(alarmPriority.name, () => {
  it('gives a severe consequence with under 3 minutes the highest priority', () => {
    expect(alarmPriority('severe', 2)).toBe('high');
  });

  it('gives a major consequence with 3 to 10 minutes medium priority', () => {
    expect(alarmPriority('major', 5)).toBe('medium');
  });

  it('gives a minor consequence with 10 to 30 minutes low priority', () => {
    expect(alarmPriority('minor', 20)).toBe('low');
  });

  it('says a minor consequence with more than 30 minutes is not an alarm', () => {
    expect(alarmPriority('minor', 45)).toBe('none');
  });

  it('never makes an alarm of something without a consequence', () => {
    for (const minutes of [0.5, 5, 20, 60]) expect(alarmPriority('none', minutes)).toBe('none');
  });

  it('never lowers the priority when the consequence gets worse', () => {
    for (const response of RESPONSE_CLASSES) {
      const ranks = CONSEQUENCE_SEVERITIES.map((severity) => RANK[matrixCell(severity, response)]);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it('never lowers the priority when there is less time', () => {
    for (const severity of CONSEQUENCE_SEVERITIES) {
      const ranks = RESPONSE_CLASSES.map((response) => RANK[matrixCell(severity, response)]);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });
});

describe(rationalise.name, () => {
  it('returns the priority and response band without a finding for an ordinary alarm', () => {
    expect(rationalise('major', 5)).toEqual({ response: '3-to-10', priority: 'medium' });
  });

  it('flags an alarm without a consequence for removal', () => {
    expect(rationalise('none', 5)).toMatchObject({ priority: 'none', finding: expect.stringContaining('Remove the alarm') });
  });

  it('flags a response time the operator cannot meet', () => {
    expect(rationalise('severe', 0.5)).toMatchObject({ priority: 'high', finding: expect.stringContaining('automatic action') });
  });

  it('suggests an alert for a minor consequence with ample time', () => {
    expect(rationalise('minor', 60)).toMatchObject({ priority: 'none', finding: expect.stringContaining('alert') });
  });
});

describe(priorityDistribution.name, () => {
  it('reports share, target and difference per priority', () => {
    const priorities: AlarmPriority[] = [...Array<AlarmPriority>(6).fill('low'), ...Array<AlarmPriority>(3).fill('medium'), 'high'];

    expect(priorityDistribution(priorities)).toEqual([
      { priority: 'low', count: 6, share: 60, target: 80, delta: -20 },
      { priority: 'medium', count: 3, share: 30, target: 15, delta: 15 },
      { priority: 'high', count: 1, share: 10, target: 5, delta: 5 },
    ]);
  });

  it('leaves entries that are not alarms out of the total', () => {
    const [low] = priorityDistribution(['low', 'none', 'none', 'medium']);

    expect(low).toMatchObject({ count: 1, share: 50 });
  });

  it('returns zero shares for an empty list', () => {
    expect(priorityDistribution([]).map((entry) => entry.share)).toEqual([0, 0, 0]);
  });

  it('lists the priorities lowest first', () => {
    expect(priorityDistribution([]).map((entry) => entry.priority)).toEqual(ALARM_PRIORITIES);
  });
});

describe(isDistributionOnTarget.name, () => {
  it('accepts a distribution within the tolerance', () => {
    const priorities: AlarmPriority[] = [...Array<AlarmPriority>(78).fill('low'), ...Array<AlarmPriority>(16).fill('medium'), ...Array<AlarmPriority>(6).fill('high')];

    expect(isDistributionOnTarget(priorityDistribution(priorities))).toBe(true);
  });

  it('rejects a distribution with too many high-priority alarms', () => {
    const priorities: AlarmPriority[] = [...Array<AlarmPriority>(50).fill('low'), ...Array<AlarmPriority>(25).fill('medium'), ...Array<AlarmPriority>(25).fill('high')];

    expect(isDistributionOnTarget(priorityDistribution(priorities))).toBe(false);
  });
});

describe(alarmPriorityStatus.name, () => {
  it('gives every priority its own word and shape', () => {
    const shapes = new Set((['none', 'low', 'medium', 'high'] as const).map((priority) => alarmPriorityStatus(priority).shape));

    expect(shapes.size).toBe(4);
    expect(alarmPriorityStatus('high')).toEqual({ tone: 'critical', label: 'High', shape: 'diamond' });
  });
});
