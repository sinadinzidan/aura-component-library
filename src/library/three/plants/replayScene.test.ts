import { sceneStateAt, stepAt, tagReadingAt } from './replayScene';
import type { ReplaySceneScript, ReplayTagSignal } from './replayScene';

type View = 'wide' | 'machine' | 'flare';

const SCRIPT: ReplaySceneScript<View> = {
  beacons: {
    recompressor: [
      { t: 22, value: { tone: 'warning', text: 'Low oil pressure' } },
      { t: 46, value: { tone: 'critical', text: 'Tripped', pulse: true } },
      { t: 49, value: { tone: 'critical', text: 'Tripped' } },
    ],
  },
  pipes: {
    'flash-gas': [{ t: 46, value: 'stopped' }],
    'flare-header': [
      { t: 0, value: 'idle' },
      { t: 49, value: 'flowing' },
    ],
  },
  flaring: [{ t: 49, value: true }],
  viewpoints: [
    { t: 22, value: 'machine' },
    { t: 49, value: 'flare' },
    { t: 55, value: 'machine' },
  ],
  openingViewpoint: 'wide',
};

describe(stepAt.name, () => {
  const track = [
    { t: 10, value: 'a' },
    { t: 20, value: 'b' },
  ];

  it('returns the initial value before the first keyframe', () => {
    expect(stepAt(track, 9, 'start')).toBe('start');
  });

  it('switches exactly on a keyframe and holds until the next', () => {
    expect(stepAt(track, 10, 'start')).toBe('a');
    expect(stepAt(track, 19.9, 'start')).toBe('a');
    expect(stepAt(track, 20, 'start')).toBe('b');
    expect(stepAt(track, 500, 'start')).toBe('b');
  });

  it('returns the initial value for an empty track', () => {
    expect(stepAt([], 5, 'start')).toBe('start');
  });
});

describe(sceneStateAt.name, () => {
  it('shows a normal plant before anything happens', () => {
    const state = sceneStateAt(SCRIPT, 5);

    expect(state.beacons.recompressor).toEqual({});
    expect(state.pipes).toEqual({ 'flash-gas': 'flowing', 'flare-header': 'idle' });
    expect(state.flaring).toBe(false);
    expect(state.viewpoint).toBe('wide');
    expect(state.cut).toBe(0);
  });

  it('turns the beacon to warning at the first warning and cuts to the machine', () => {
    const state = sceneStateAt(SCRIPT, 22);

    expect(state.beacons.recompressor).toMatchObject({ tone: 'warning' });
    expect(state.viewpoint).toBe('machine');
    expect(state.cut).toBe(1);
  });

  it('pulses the machine and stops its line at the trip', () => {
    const state = sceneStateAt(SCRIPT, 46);

    expect(state.beacons.recompressor).toMatchObject({ tone: 'critical', pulse: true });
    expect(state.pipes['flash-gas']).toBe('stopped');
    expect(state.flaring).toBe(false);
  });

  it('lights the flare and stops the pulse once the operator acknowledges', () => {
    const state = sceneStateAt(SCRIPT, 49);

    expect(state.flaring).toBe(true);
    expect(state.pipes['flare-header']).toBe('flowing');
    expect(state.beacons.recompressor.pulse).toBeUndefined();
    expect(state.viewpoint).toBe('flare');
  });

  it('is the same going backwards as forwards', () => {
    const forwards = [5, 22, 46, 49, 58].map((t) => sceneStateAt(SCRIPT, t));
    const backwards = [58, 49, 46, 22, 5].map((t) => sceneStateAt(SCRIPT, t)).reverse();

    expect(backwards).toEqual(forwards);
  });

  it('counts the cuts made so far', () => {
    expect(sceneStateAt(SCRIPT, 60).cut).toBe(3);
    expect(sceneStateAt(SCRIPT, 60).viewpoint).toBe('machine');
  });
});

describe(tagReadingAt.name, () => {
  const vibration: ReplayTagSignal = {
    id: 'vibration',
    label: 'Vibration',
    unit: 'mm/s',
    decimals: 1,
    limits: { high: 7.1, highHigh: 11 },
    points: [
      { t: 0, v: 4 },
      { t: 10, v: 8 },
      { t: 20, v: 12 },
    ],
  };

  it('interpolates the value at the playhead and formats it with its unit', () => {
    const reading = tagReadingAt(vibration, 5);

    expect(reading.value).toBe(6);
    expect(reading.text).toBe('6.0\u00a0mm/s');
    expect(reading.tone).toBe('neutral');
  });

  it('judges the value against its limits', () => {
    expect(tagReadingAt(vibration, 10).tone).toBe('warning');
    expect(tagReadingAt(vibration, 20).tone).toBe('critical');
  });

  it('reads nothing before the first sample', () => {
    const reading = tagReadingAt(vibration, -1);

    expect(reading.value).toBeNull();
    expect(reading.text).toBe('\u2014');
    expect(reading.tone).toBe('neutral');
  });
});
