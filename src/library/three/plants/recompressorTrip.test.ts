import { readingAt, stateAt } from '../../experiences/journeys/replayState';

import { TRIP_IDS, TRIP_MINUTES, TRIP_TAGS_BY_VIEW, tripEvents, tripPhase, tripSceneAt, tripScript, tripSeries, tripSignals } from './recompressorTrip';
import { tagReadingAt } from './replayScene';

const START = Date.UTC(2026, 2, 12, 13, 0, 0);
const at = (minute: number): number => START + minute * 60_000;

describe(tripSeries.name, () => {
  it('has one sample a minute for an hour, oldest first', () => {
    const points = tripSeries(START, 0.1, 1, [[0, 5], [60, 5]]);

    expect(points).toHaveLength(61);
    expect(points[0].t).toBe(START);
    expect(points[60].t).toBe(at(60));
  });

  it('hits every knot exactly', () => {
    const points = tripSeries(START, 0.5, 1, [[0, 4], [30, 9], [60, 2]]);

    expect(points[30].v).toBe(9);
    expect(points[0].v).toBe(4);
  });

  it('is the same every time', () => {
    expect(tripSeries(START, 0.5, 1, [[0, 4], [60, 9]])).toEqual(tripSeries(START, 0.5, 1, [[0, 4], [60, 9]]));
  });

  it('never goes below zero', () => {
    expect(tripSeries(START, 5, 1, [[0, 0.2], [60, 0.2]]).every((point) => point.v >= 0)).toBe(true);
  });
});

describe('trip signals and events', () => {
  const signals = tripSignals(START);

  it('reads the values quoted in the event log at the moments of the events', () => {
    const vibration = signals.find((signal) => signal.id === 'vibration');
    const oil = signals.find((signal) => signal.id === 'oil-pressure');

    expect(vibration && readingAt(vibration, at(TRIP_MINUTES.trip)).value).toBe(11.6);
    expect(vibration && readingAt(vibration, at(TRIP_MINUTES.alarm)).value).toBe(7.3);
    expect(oil && readingAt(oil, at(TRIP_MINUTES.warning)).value).toBe(1.78);
  });

  it('judges the trip reading as a trip and the first warning as a warning', () => {
    const vibration = signals.find((signal) => signal.id === 'vibration');
    const oil = signals.find((signal) => signal.id === 'oil-pressure');

    expect(vibration && readingAt(vibration, at(TRIP_MINUTES.trip)).alarm).toBe('trip');
    expect(oil && readingAt(oil, at(TRIP_MINUTES.warning)).alarm).toBe('warning');
  });

  it('lists six events in time order starting with normal operation', () => {
    const events = tripEvents(START);

    expect(events.map((event) => event.id)).toEqual(['normal', 'warning', 'alarm', 'trip', 'acknowledge', 'restart']);
    expect(events.every((event, index) => index === 0 || event.t > events[index - 1].t)).toBe(true);
  });

  it('puts the current event at the trip from the trip minute on', () => {
    const replay = { signals, events: tripEvents(START), causes: [] };

    expect(stateAt(replay, at(45)).eventIndex).toBe(2);
    expect(stateAt(replay, at(46)).eventIndex).toBe(3);
  });
});

describe(tripScript.name, () => {
  const script = tripScript(START);

  it('keeps the machine normal before the first warning', () => {
    expect(tripSceneAt(START, at(10)).beacons[TRIP_IDS.machine]).toEqual({});
  });

  it('turns the machine beacon warning, then critical and pulsing at the trip', () => {
    expect(tripSceneAt(START, at(23)).beacons[TRIP_IDS.machine]).toMatchObject({ tone: 'warning' });
    expect(tripSceneAt(START, at(46)).beacons[TRIP_IDS.machine]).toMatchObject({ tone: 'critical', pulse: true });
  });

  it('stops pulsing once acknowledged but stays critical', () => {
    const beacon = tripSceneAt(START, at(50)).beacons[TRIP_IDS.machine];

    expect(beacon).toMatchObject({ tone: 'critical' });
    expect(beacon.pulse).toBeUndefined();
  });

  it('stops the machine lines at the trip and keeps them stopped', () => {
    expect(tripSceneAt(START, at(45)).pipes[TRIP_IDS.suction]).toBe('flowing');
    expect(tripSceneAt(START, at(46)).pipes[TRIP_IDS.suction]).toBe('stopped');
    expect(tripSceneAt(START, at(58)).pipes[TRIP_IDS.discharge]).toBe('stopped');
  });

  it('routes gas to the flare when the operator acknowledges', () => {
    expect(tripSceneAt(START, at(48)).flaring).toBe(false);
    expect(tripSceneAt(START, at(48)).pipes[TRIP_IDS.flareHeader]).toBe('idle');
    expect(tripSceneAt(START, at(49)).flaring).toBe(true);
    expect(tripSceneAt(START, at(49)).pipes[TRIP_IDS.flareHeader]).toBe('flowing');
  });

  it('shows the neighbouring compressor taking load after the trip', () => {
    expect(tripSceneAt(START, at(46)).beacons[TRIP_IDS.neighbour]).toEqual({});
    expect(tripSceneAt(START, at(47)).beacons[TRIP_IDS.neighbour]).toMatchObject({ text: 'Taking more load' });
  });

  it('cuts wide, machine, flare, machine, wide as the action moves', () => {
    const views = [0, 22, 46, 49, 55, 59].map((minute) => tripSceneAt(START, at(minute)).viewpoint);

    expect(views).toEqual(['wide', 'machine', 'machine', 'flare', 'machine', 'wide']);
    expect(script.openingViewpoint).toBe('wide');
  });

  it('is a function of the playhead alone: scrubbing back returns the earlier scene', () => {
    const forward = [10, 30, 46, 52, 58].map((minute) => tripSceneAt(START, at(minute)));
    const there = [58, 52, 46, 30, 10].map((minute) => tripSceneAt(START, at(minute))).reverse();

    expect(there).toEqual(forward);
  });

  it('is the same script on another clock', () => {
    const other = Date.UTC(2027, 0, 5, 3, 0, 0);

    expect(tripSceneAt(other, other + 46 * 60_000).beacons[TRIP_IDS.machine]).toEqual(tripSceneAt(START, at(46)).beacons[TRIP_IDS.machine]);
  });
});

describe('floating tags', () => {
  it('reads the signal at the playhead through the pure tag reading', () => {
    const vibration = tripSignals(START).find((signal) => signal.id === 'vibration');
    const reading = vibration ? tagReadingAt(vibration, at(TRIP_MINUTES.trip)) : null;

    expect(reading?.text).toBe('11.6 mm/s');
    expect(reading?.tone).toBe('critical');
  });

  it('shows four tags up close, one from afar and none by the flare', () => {
    expect(TRIP_TAGS_BY_VIEW.machine).toHaveLength(4);
    expect(TRIP_TAGS_BY_VIEW.wide).toEqual(['vibration']);
    expect(TRIP_TAGS_BY_VIEW.flare).toEqual([]);
  });

  it('only names signals that exist', () => {
    const ids = tripSignals(START).map((signal) => signal.id);

    for (const view of Object.values(TRIP_TAGS_BY_VIEW)) for (const id of view) expect(ids).toContain(id);
  });
});

describe(tripPhase.name, () => {
  it('names the situation after each event and clamps out-of-range indexes', () => {
    expect(tripPhase(-1).label).toBe('Normal operation');
    expect(tripPhase(3)).toEqual({ label: 'Tripped', tone: 'critical' });
    expect(tripPhase(99).label).toBe('Restart failed');
  });
});
