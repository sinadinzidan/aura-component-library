import { toneFromLimits } from '../../industrial/status';
import type { Limits, Tone } from '../../industrial/status';

/**
 * Everything a replay screen derives from its playhead. All functions are pure: the same series
 * and the same time always give the same state, which is what makes scrubbing back and forth safe.
 */
export type ReplayPoint = { t: number; v: number };

export type ReplaySignal = {
  id: string;
  label: string;
  tag: string;
  unit: string;
  decimals: number;
  limits: Limits;
  /** Oldest first, strictly increasing in time. */
  points: readonly ReplayPoint[];
};

export type ReplayEvent = {
  id: string;
  t: number;
  title: string;
  detail?: string;
  /** Neutral unless the event is itself an abnormal state change. */
  tone: Tone;
};

export type ReplayCause = {
  id: string;
  /** When this link of the chain becomes known. */
  t: number;
  title: string;
  detail: string;
};

export type AlarmState = 'normal' | 'warning' | 'trip';

export type ReplayReading = {
  id: string;
  label: string;
  tag: string;
  unit: string;
  decimals: number;
  /** `null` before the first sample. */
  value: number | null;
  tone: Tone;
  alarm: AlarmState;
  /** Change over the previous five minutes; `null` when there is no earlier sample. */
  change: number | null;
};

export type ReplayState = {
  t: number;
  readings: ReplayReading[];
  /** Index of the latest event at or before `t`; -1 before the first. */
  eventIndex: number;
  /** How many links of the causal chain are known at `t`. */
  revealedCauses: number;
  /** Worst reading tone at `t`. */
  worst: Tone;
};

const TREND_WINDOW_MS = 5 * 60_000;

/** Keeps a time inside the replay and on the step grid. */
export function clampTime(t: number, from: number, to: number, stepMs = 1): number {
  const bounded = Math.min(Math.max(t, from), to);
  if (stepMs <= 1) return bounded;
  return Math.min(from + Math.round((bounded - from) / stepMs) * stepMs, to);
}

/** Moves the playhead by `deltaMs`, staying inside the replay. */
export function stepTime(t: number, deltaMs: number, from: number, to: number): number {
  return Math.min(Math.max(t + deltaMs, from), to);
}

/** Position of a time on the replay as a 0–1 fraction. */
export function timeFraction(t: number, from: number, to: number): number {
  if (to <= from) return 0;
  return Math.min(Math.max((t - from) / (to - from), 0), 1);
}

/** Value at `t`, interpolated between samples. `null` before the first sample; holds after the last. */
export function valueAt(points: readonly ReplayPoint[], t: number): number | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || t < first.t) return null;
  if (t >= last.t) return last.v;
  const nextIndex = points.findIndex((point) => point.t > t);
  const before = points[nextIndex - 1] ?? first;
  const after = points[nextIndex] ?? last;
  const span = after.t - before.t;
  return span === 0 ? before.v : before.v + ((after.v - before.v) * (t - before.t)) / span;
}

/** The part of a series that has happened by `t`, ending on an interpolated point exactly at `t`. */
export function visiblePoints(points: readonly ReplayPoint[], t: number): ReplayPoint[] {
  const shown = points.filter((point) => point.t <= t);
  const last = shown[shown.length - 1];
  const value = valueAt(points, t);
  if (!last || value === null) return [];
  const final = points[points.length - 1];
  if (last.t < t && final && t < final.t) shown.push({ t, v: value });
  return shown;
}

export function alarmStateFromTone(tone: Tone): AlarmState {
  if (tone === 'critical') return 'trip';
  if (tone === 'warning') return 'warning';
  return 'normal';
}

const TONE_RANK: Record<Tone, number> = { neutral: 0, success: 0, info: 1, warning: 2, critical: 3 };

/** The more severe of two tones. */
export function worseTone(a: Tone, b: Tone): Tone {
  return TONE_RANK[b] > TONE_RANK[a] ? b : a;
}

/** One signal at `t`: its value, where it stands against its limits and how it has been moving. */
export function readingAt(signal: ReplaySignal, t: number): ReplayReading {
  const value = valueAt(signal.points, t);
  const earlier = valueAt(signal.points, t - TREND_WINDOW_MS);
  const tone = value === null ? 'neutral' : toneFromLimits(value, signal.limits);
  return {
    id: signal.id,
    label: signal.label,
    tag: signal.tag,
    unit: signal.unit,
    decimals: signal.decimals,
    value,
    tone,
    alarm: alarmStateFromTone(tone),
    change: value === null || earlier === null ? null : value - earlier,
  };
}

/** Index of the latest event at or before `t`; -1 when none has happened. Events must be sorted. */
export function currentEventIndex(events: readonly { t: number }[], t: number): number {
  let index = -1;
  events.forEach((event, position) => {
    if (event.t <= t) index = position;
  });
  return index;
}

/** How many links of a sorted causal chain are known at `t`. */
export function revealedCount(causes: readonly { t: number }[], t: number): number {
  return causes.filter((cause) => cause.t <= t).length;
}

/** The whole derived state of a replay at one moment. */
export function stateAt(
  replay: { signals: readonly ReplaySignal[]; events: readonly ReplayEvent[]; causes: readonly ReplayCause[] },
  t: number
): ReplayState {
  const readings = replay.signals.map((signal) => readingAt(signal, t));
  return {
    t,
    readings,
    eventIndex: currentEventIndex(replay.events, t),
    revealedCauses: revealedCount(replay.causes, t),
    worst: readings.reduce<Tone>((worst, reading) => worseTone(worst, reading.tone), 'neutral'),
  };
}
