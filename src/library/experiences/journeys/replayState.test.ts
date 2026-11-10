import {
  alarmStateFromTone,
  clampTime,
  currentEventIndex,
  readingAt,
  revealedCount,
  stateAt,
  stepTime,
  timeFraction,
  valueAt,
  visiblePoints,
  worseTone,
} from './replayState';
import type { ReplayCause, ReplayEvent, ReplaySignal } from './replayState';

const MINUTE = 60_000;
const FROM = Date.UTC(2026, 2, 12, 13, 0, 0);
const at = (minute: number): number => FROM + minute * MINUTE;

const VIBRATION: ReplaySignal = {
  id: 'vibration',
  label: 'Vibration',
  tag: '23-VT-92740',
  unit: 'mm/s',
  decimals: 1,
  limits: { high: 7.1, highHigh: 11 },
  points: [
    { t: at(0), v: 4 },
    { t: at(10), v: 6 },
    { t: at(20), v: 8 },
    { t: at(30), v: 12 },
  ],
};

const EVENTS: ReplayEvent[] = [
  { id: 'warning', t: at(12), title: 'First warning', tone: 'info' },
  { id: 'alarm', t: at(18), title: 'High alarm', tone: 'warning' },
  { id: 'trip', t: at(28), title: 'Trip', tone: 'critical' },
];

const CAUSES: ReplayCause[] = [
  { id: 'filter', t: at(5), title: 'Filter clogs', detail: 'Differential pressure rises.' },
  { id: 'pressure', t: at(12), title: 'Oil pressure falls', detail: 'Below the low limit.' },
  { id: 'trip', t: at(28), title: 'Trip', detail: 'High-high vibration.' },
];

describe('clampTime', () => {
  it('keeps a time inside the replay', () => {
    expect(clampTime(at(-5), at(0), at(30))).toBe(at(0));
    expect(clampTime(at(45), at(0), at(30))).toBe(at(30));
  });

  it('snaps to the step grid', () => {
    expect(clampTime(at(4) + 20_000, at(0), at(30), MINUTE)).toBe(at(4));
    expect(clampTime(at(4) + 40_000, at(0), at(30), MINUTE)).toBe(at(5));
  });
});

describe('stepTime', () => {
  it('moves by the delta', () => {
    expect(stepTime(at(10), MINUTE, at(0), at(30))).toBe(at(11));
    expect(stepTime(at(10), -MINUTE, at(0), at(30))).toBe(at(9));
  });

  it('stops at both ends', () => {
    expect(stepTime(at(30), MINUTE, at(0), at(30))).toBe(at(30));
    expect(stepTime(at(0), -MINUTE, at(0), at(30))).toBe(at(0));
  });
});

describe('timeFraction', () => {
  it('maps a time to 0–1', () => {
    expect(timeFraction(at(15), at(0), at(30))).toBe(0.5);
    expect(timeFraction(at(90), at(0), at(30))).toBe(1);
    expect(timeFraction(at(-1), at(0), at(30))).toBe(0);
  });

  it('is 0 for an empty span', () => {
    expect(timeFraction(at(1), at(0), at(0))).toBe(0);
  });
});

describe('valueAt', () => {
  it('returns a sample exactly on its time', () => {
    expect(valueAt(VIBRATION.points, at(10))).toBe(6);
  });

  it('interpolates between samples', () => {
    expect(valueAt(VIBRATION.points, at(5))).toBe(5);
    expect(valueAt(VIBRATION.points, at(25))).toBe(10);
  });

  it('is null before the first sample and holds after the last', () => {
    expect(valueAt(VIBRATION.points, at(-1))).toBeNull();
    expect(valueAt(VIBRATION.points, at(60))).toBe(12);
    expect(valueAt([], at(0))).toBeNull();
  });
});

describe('visiblePoints', () => {
  it('keeps the samples so far and ends on the playhead', () => {
    expect(visiblePoints(VIBRATION.points, at(15))).toEqual([
      { t: at(0), v: 4 },
      { t: at(10), v: 6 },
      { t: at(15), v: 7 },
    ]);
  });

  it('adds no extra point when the playhead is on a sample', () => {
    expect(visiblePoints(VIBRATION.points, at(10))).toHaveLength(2);
  });

  it('is empty before the start and complete after the end', () => {
    expect(visiblePoints(VIBRATION.points, at(-1))).toEqual([]);
    expect(visiblePoints(VIBRATION.points, at(99))).toHaveLength(4);
  });
});

describe('readingAt', () => {
  it('is normal inside the limits', () => {
    expect(readingAt(VIBRATION, at(5))).toMatchObject({ value: 5, tone: 'neutral', alarm: 'normal' });
  });

  it('is a warning above the high limit', () => {
    expect(readingAt(VIBRATION, at(20))).toMatchObject({ value: 8, tone: 'warning', alarm: 'warning' });
  });

  it('is a trip at the high-high limit', () => {
    expect(readingAt(VIBRATION, at(30))).toMatchObject({ value: 12, tone: 'critical', alarm: 'trip' });
  });

  it('reports the change over the last five minutes', () => {
    expect(readingAt(VIBRATION, at(10)).change).toBe(1);
    expect(readingAt(VIBRATION, at(2)).change).toBeNull();
  });

  it('has no value before the first sample', () => {
    expect(readingAt(VIBRATION, at(-3))).toMatchObject({ value: null, tone: 'neutral', change: null });
  });
});

describe('currentEventIndex and revealedCount', () => {
  it('is -1 before the first event', () => {
    expect(currentEventIndex(EVENTS, at(3))).toBe(-1);
  });

  it('is the latest event at or before the playhead', () => {
    expect(currentEventIndex(EVENTS, at(12))).toBe(0);
    expect(currentEventIndex(EVENTS, at(20))).toBe(1);
    expect(currentEventIndex(EVENTS, at(30))).toBe(2);
  });

  it('counts the causes known so far', () => {
    expect(revealedCount(CAUSES, at(0))).toBe(0);
    expect(revealedCount(CAUSES, at(12))).toBe(2);
    expect(revealedCount(CAUSES, at(30))).toBe(3);
  });
});

describe('tone helpers', () => {
  it('picks the worse tone', () => {
    expect(worseTone('neutral', 'warning')).toBe('warning');
    expect(worseTone('critical', 'warning')).toBe('critical');
    expect(worseTone('success', 'neutral')).toBe('success');
  });

  it('names the alarm state of a tone', () => {
    expect(alarmStateFromTone('critical')).toBe('trip');
    expect(alarmStateFromTone('warning')).toBe('warning');
    expect(alarmStateFromTone('info')).toBe('normal');
  });
});

describe('stateAt', () => {
  const replay = { signals: [VIBRATION], events: EVENTS, causes: CAUSES };

  it('is quiet at the start', () => {
    expect(stateAt(replay, at(0))).toMatchObject({ eventIndex: -1, revealedCauses: 0, worst: 'neutral' });
  });

  it('combines readings, event and chain mid-replay', () => {
    const state = stateAt(replay, at(20));
    expect(state.readings[0]).toMatchObject({ value: 8, alarm: 'warning' });
    expect(state).toMatchObject({ t: at(20), eventIndex: 1, revealedCauses: 2, worst: 'warning' });
  });

  it('gives the same state when scrubbing back to a time', () => {
    expect(stateAt(replay, at(20))).toEqual(stateAt(replay, at(20)));
  });

  it('is critical at the trip', () => {
    expect(stateAt(replay, at(30))).toMatchObject({ eventIndex: 2, revealedCauses: 3, worst: 'critical' });
  });
});
