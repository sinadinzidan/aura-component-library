import { STATION_STATES, bottleneckIndex, countStates, firstPassYield, formatClock, judgeTakt, stationStatus, taktTime } from './lines';

describe(stationStatus.name, () => {
  it.each([
    ['running', 'Running', 'success'],
    ['idle', 'Idle', 'neutral'],
    ['blocked', 'Blocked', 'warning'],
    ['starved', 'Starved', 'info'],
    ['down', 'Down', 'critical'],
  ] as const)('describes %s', (state, label, tone) => {
    expect(stationStatus(state)).toMatchObject({ label, tone });
  });

  it('lists every state once', () => {
    expect(new Set(STATION_STATES).size).toBe(5);
  });
});

describe(countStates.name, () => {
  it('counts stations per state', () => {
    expect(countStates(['running', 'running', 'blocked', 'down'])).toEqual({ running: 2, idle: 0, blocked: 1, starved: 0, down: 1 });
  });
});

describe(taktTime.name, () => {
  it('divides available time by demand', () => {
    expect(taktTime(27000, 600)).toBe(45);
  });

  it('is null without demand', () => {
    expect(taktTime(27000, 0)).toBeNull();
  });
});

describe(judgeTakt.name, () => {
  it('is critical over takt', () => {
    expect(judgeTakt(48.2, 45)).toMatchObject({ tone: 'critical', label: 'Over takt' });
    expect(judgeTakt(48.2, 45).gap).toBeCloseTo(3.2, 6);
  });

  it('warns when there is no slack', () => {
    expect(judgeTakt(44, 45)).toMatchObject({ tone: 'warning', label: 'At takt' });
  });

  it('is neutral with slack', () => {
    expect(judgeTakt(40, 45)).toMatchObject({ tone: 'neutral', label: 'Under takt' });
  });

  it('counts exactly on takt as no slack', () => {
    expect(judgeTakt(45, 45).tone).toBe('warning');
  });

  it('takes a custom tolerance', () => {
    expect(judgeTakt(40, 45, 0.2).tone).toBe('warning');
  });
});

describe(firstPassYield.name, () => {
  it('is first-time passes over starts in percent', () => {
    expect(firstPassYield(470, 500)).toBe(94);
  });

  it('is null with nothing started', () => {
    expect(firstPassYield(0, 0)).toBeNull();
  });
});

describe(bottleneckIndex.name, () => {
  it('finds the slowest station', () => {
    expect(bottleneckIndex([41, 44, 48.2, 43])).toBe(2);
  });

  it('is -1 for no stations', () => {
    expect(bottleneckIndex([])).toBe(-1);
  });
});

describe(formatClock.name, () => {
  it.each([
    [725, '12:05'],
    [59, '0:59'],
    [0, '0:00'],
    [-4, '0:00'],
  ])('formats %s seconds as %s', (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});
