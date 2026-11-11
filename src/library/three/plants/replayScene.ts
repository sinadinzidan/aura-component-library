import { valueAt } from '../../experiences/journeys/replayState';
import type { ReplayPoint } from '../../experiences/journeys/replayState';
import { formatReading, toneFromLimits } from '../../industrial/status';
import type { DotShape, Limits, Tone } from '../../industrial/status';
import type { SceneTone } from '../scenePalette';

/**
 * What a 3D scene shows at one moment of a replay. Everything here is a pure function of the
 * playhead: scrub back and the plant goes back with it. A scene is scripted as step tracks —
 * lists of keyframes, each holding from its time until the next.
 */
export type Keyframe<T> = { t: number; value: T };

/** The value of a step track at `t`: the latest keyframe at or before it, else `initial`. Tracks must be sorted. */
export function stepAt<T>(track: readonly Keyframe<T>[], t: number, initial: T): T {
  let value = initial;
  for (const keyframe of track) {
    if (keyframe.t > t) break;
    value = keyframe.value;
  }
  return value;
}

/** The status ring and words for one piece of equipment. An empty object is normal operation. */
export type ReplayBeacon = {
  tone?: SceneTone;
  shape?: DotShape;
  text?: string;
  /** Pulse the ring: the state is new and nobody has acknowledged it. */
  pulse?: boolean;
};

/** `flowing`: chevrons move. `stopped`: chevrons hold still in the critical tone. `idle`: an empty line, no chevrons. */
export type ReplayPipeState = 'flowing' | 'stopped' | 'idle';

export type ReplaySceneScript<Viewpoint extends string> = {
  /** Status over time, per equipment id. Equipment without a track stays normal. */
  beacons: Readonly<Record<string, readonly Keyframe<ReplayBeacon>[]>>;
  /** Flow over time, per pipe id. Pipes without a track keep flowing. */
  pipes: Readonly<Record<string, readonly Keyframe<ReplayPipeState>[]>>;
  /** When gas is routed to the flare. */
  flaring: readonly Keyframe<boolean>[];
  /** Camera cuts: which pre-set viewpoint shows the action from each moment on. */
  viewpoints: readonly Keyframe<Viewpoint>[];
  /** The viewpoint before the first cut. */
  openingViewpoint: Viewpoint;
};

export type ReplaySceneState<Viewpoint extends string> = {
  t: number;
  beacons: Record<string, ReplayBeacon>;
  pipes: Record<string, ReplayPipeState>;
  flaring: boolean;
  viewpoint: Viewpoint;
  /** Number of camera cuts so far. */
  cut: number;
};

const NORMAL: ReplayBeacon = {};

/** The whole scene at `t`. */
export function sceneStateAt<Viewpoint extends string>(script: ReplaySceneScript<Viewpoint>, t: number): ReplaySceneState<Viewpoint> {
  const beacons: Record<string, ReplayBeacon> = {};
  for (const [id, track] of Object.entries(script.beacons)) beacons[id] = stepAt(track, t, NORMAL);
  const pipes: Record<string, ReplayPipeState> = {};
  for (const [id, track] of Object.entries(script.pipes)) pipes[id] = stepAt<ReplayPipeState>(track, t, 'flowing');
  return {
    t,
    beacons,
    pipes,
    flaring: stepAt(script.flaring, t, false),
    viewpoint: stepAt(script.viewpoints, t, script.openingViewpoint),
    cut: script.viewpoints.filter((keyframe) => keyframe.t <= t).length,
  };
}

/** A measured signal shown as a floating tag in the scene. */
export type ReplayTagSignal = {
  id: string;
  label: string;
  unit: string;
  decimals: number;
  limits: Limits;
  /** Oldest first. */
  points: readonly ReplayPoint[];
};

export type ReplayTagReading = {
  id: string;
  label: string;
  /** `null` before the first sample. */
  value: number | null;
  /** The value with its unit, or an em dash. */
  text: string;
  tone: Tone;
};

/** What a tag reads at `t`: the interpolated value, formatted, and judged against its limits. */
export function tagReadingAt(signal: ReplayTagSignal, t: number): ReplayTagReading {
  const value = valueAt(signal.points, t);
  return {
    id: signal.id,
    label: signal.label,
    value,
    text: formatReading(value, signal.unit, signal.decimals),
    tone: value === null ? 'neutral' : toneFromLimits(value, signal.limits),
  };
}
