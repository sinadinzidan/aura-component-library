import type { ReplayEvent, ReplayPoint, ReplaySignal } from '../../experiences/journeys/replayState';
import type { Tone } from '../../industrial/status';

import { sceneStateAt } from './replayScene';
import type { Keyframe, ReplaySceneScript, ReplaySceneState } from './replayScene';

/**
 * The recompressor trip of 12 March as data for a scene: one hour of readings, the event log, and
 * a script saying what the plant looks like at every minute. Times are offsets from `start`, so
 * the same incident can be replayed on any clock.
 */
export type TripViewpoint = 'wide' | 'machine' | 'flare';

const MINUTE_MS = 60_000;

/** The minutes of the replay at which things happen. */
export const TRIP_MINUTES = { warning: 22, alarm: 34, trip: 46, acknowledge: 49, restart: 55, failed: 57, end: 60 } as const;

/** Ids the script uses, so a layout can bind to them. */
export const TRIP_IDS = {
  machine: '23-ka-9103',
  neighbour: '23-ka-9102',
  suction: 'k3-suction',
  discharge: 'k3-discharge',
  flareHeader: 'flare-header',
} as const;

type Knot = readonly [number, number];

/** A one-minute series through (minute, value) knots. Between knots it is linear plus a small deterministic wobble; knots are exact. */
export function tripSeries(start: number, noise: number, decimals: number, knots: readonly Knot[]): ReplayPoint[] {
  const factor = 10 ** decimals;
  return Array.from({ length: TRIP_MINUTES.end + 1 }, (_, minute) => {
    const nextIndex = knots.findIndex(([at]) => at >= minute);
    const [m1, v1] = knots[nextIndex === -1 ? knots.length - 1 : nextIndex] ?? [TRIP_MINUTES.end, 0];
    const [m0, v0] = knots[Math.max(nextIndex - 1, 0)] ?? [0, v1];
    const base = m1 === m0 ? v1 : v0 + ((v1 - v0) * (minute - m0)) / (m1 - m0);
    const onKnot = knots.some(([at]) => at === minute);
    const wobble = Math.sin(minute * 12.9898 + noise * 78.233) * 0.5;
    const jitter = onKnot ? 0 : wobble * noise * Math.min(Math.abs(base) / (noise * 20 || 1), 1);
    return { t: start + minute * MINUTE_MS, v: Math.round(Math.max(base + jitter, 0) * factor) / factor };
  });
}

/** The four signals shown on the machine's tags and in the trend rail. */
export function tripSignals(start: number): ReplaySignal[] {
  return [
    {
      id: 'oil-pressure',
      label: 'Lube oil pressure',
      tag: '23-PT-92720',
      unit: 'barg',
      decimals: 2,
      limits: { low: 1.8, lowLow: 1.2 },
      points: tripSeries(start, 0.012, 2, [[0, 2.4], [5, 2.4], [22, 1.78], [34, 1.62], [46, 1.48], [49, 1.55], [60, 1.55]]),
    },
    {
      id: 'bearing-temperature',
      label: 'Bearing temperature',
      tag: '23-TT-92745',
      unit: '°C',
      decimals: 1,
      limits: { high: 95, highHigh: 115 },
      points: tripSeries(start, 0.35, 1, [[0, 78], [20, 79], [28, 86], [34, 93.5], [40, 99.5], [46, 106], [50, 101], [60, 88]]),
    },
    {
      id: 'vibration',
      label: 'Drive-end vibration',
      tag: '23-VT-92740',
      unit: 'mm/s',
      decimals: 1,
      limits: { high: 7.1, highHigh: 11 },
      points: tripSeries(start, 0.09, 1, [[0, 4.2], [18, 4.4], [26, 5.6], [34, 7.3], [40, 8.9], [45, 10.6], [46, 11.6], [47, 6], [49, 0.4], [54, 0.3], [55, 1.2], [56, 4.8], [57, 0.6], [60, 0.3]]),
    },
    {
      id: 'speed',
      label: 'Shaft speed',
      tag: '23-ST-92701',
      unit: 'rpm',
      decimals: 0,
      limits: {},
      points: tripSeries(start, 14, 0, [[0, 9620], [46, 9600], [47, 4200], [49, 0], [54, 0], [55, 600], [56, 2350], [57, 300], [58, 0], [60, 0]]),
    },
  ];
}

/** Value domains for drawing each signal, so a trend does not rescale while it draws. */
export const TRIP_DOMAINS: Readonly<Record<string, readonly [number, number]>> = {
  'oil-pressure': [1, 2.8],
  'bearing-temperature': [70, 120],
  vibration: [0, 13],
  speed: [0, 11000],
};

/** The event log: the first entry is normal operation, then the five moments the replay marks. */
export function tripEvents(start: number): ReplayEvent[] {
  const at = (minute: number): number => start + minute * MINUTE_MS;
  return [
    { id: 'normal', t: at(0), title: 'Normal operation', detail: 'Recompressor running at 9,620 rpm with every reading inside its band.', tone: 'neutral' },
    { id: 'warning', t: at(TRIP_MINUTES.warning), title: 'First warning', detail: 'Lube oil pressure low: 1.78 barg against a 1.80 barg limit.', tone: 'warning' },
    { id: 'alarm', t: at(TRIP_MINUTES.alarm), title: 'High alarm', detail: 'Drive-end vibration high: 7.3 mm/s against a 7.1 mm/s limit.', tone: 'warning' },
    { id: 'trip', t: at(TRIP_MINUTES.trip), title: 'Trip', detail: 'Recompressor tripped on high-high vibration: 11.6 mm/s, limit 11.0 mm/s.', tone: 'critical' },
    { id: 'acknowledge', t: at(TRIP_MINUTES.acknowledge), title: 'Operator acknowledge', detail: 'Ingrid Haugen acknowledged the trip and routed gas to flare.', tone: 'neutral' },
    { id: 'restart', t: at(TRIP_MINUTES.restart), title: 'Restart attempt', detail: 'Restart aborted at 2,350 rpm when vibration climbed again.', tone: 'info' },
  ];
}

const kf = <T,>(minute: number, start: number, value: T): Keyframe<T> => ({ t: start + minute * MINUTE_MS, value });

/** What the plant looks like over the hour: beacons, lines, flare and the camera cuts that follow the action. */
export function tripScript(start: number): ReplaySceneScript<TripViewpoint> {
  const m = TRIP_MINUTES;
  return {
    beacons: {
      [TRIP_IDS.machine]: [
        kf(m.warning, start, { tone: 'warning', shape: 'square', text: 'Low oil pressure' }),
        kf(m.alarm, start, { tone: 'warning', shape: 'square', text: 'High vibration' }),
        kf(m.trip, start, { tone: 'critical', shape: 'diamond', text: 'Tripped', pulse: true }),
        kf(m.acknowledge, start, { tone: 'critical', shape: 'diamond', text: 'Tripped, acknowledged' }),
        kf(m.restart, start, { tone: 'info', shape: 'dot', text: 'Restarting', pulse: true }),
        kf(m.failed, start, { tone: 'critical', shape: 'diamond', text: 'Restart failed' }),
      ],
      [TRIP_IDS.neighbour]: [kf(m.trip + 1, start, { tone: 'info', shape: 'dot', text: 'Taking more load' })],
    },
    pipes: {
      [TRIP_IDS.suction]: [kf(m.trip, start, 'stopped' as const)],
      [TRIP_IDS.discharge]: [kf(m.trip, start, 'stopped' as const)],
      [TRIP_IDS.flareHeader]: [kf(0, start, 'idle' as const), kf(m.acknowledge, start, 'flowing' as const)],
    },
    flaring: [kf(m.acknowledge, start, true)],
    viewpoints: [kf(m.warning, start, 'machine' as const), kf(m.acknowledge, start, 'flare' as const), kf(m.restart, start, 'machine' as const), kf(m.failed + 2, start, 'wide' as const)],
    openingViewpoint: 'wide',
  };
}

/** What the screen calls the situation after each event of the log. */
export const TRIP_PHASES: readonly { label: string; tone: Tone }[] = [
  { label: 'Normal operation', tone: 'success' },
  { label: 'Degrading', tone: 'warning' },
  { label: 'In alarm', tone: 'warning' },
  { label: 'Tripped', tone: 'critical' },
  { label: 'Tripped, on flare', tone: 'critical' },
  { label: 'Restart failed', tone: 'critical' },
];

export function tripPhase(eventIndex: number): { label: string; tone: Tone } {
  return TRIP_PHASES[Math.min(Math.max(eventIndex, 0), TRIP_PHASES.length - 1)] ?? TRIP_PHASES[0];
}

/** Which tags the scene shows from each camera viewpoint: all four up close, one from afar, none by the flare. */
export const TRIP_TAGS_BY_VIEW: Readonly<Record<TripViewpoint, readonly string[]>> = {
  wide: ['vibration'],
  machine: ['oil-pressure', 'bearing-temperature', 'vibration', 'speed'],
  flare: [],
};

/** The scene at `t` for a trip started at `start`. */
export function tripSceneAt(start: number, t: number): ReplaySceneState<TripViewpoint> {
  return sceneStateAt(tripScript(start), t);
}
