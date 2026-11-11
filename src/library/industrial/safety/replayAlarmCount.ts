/**
 * Replays recorded values against an alarm setting and counts how often the alarm would have
 * been raised. Used to compare a proposed limit, deadband or delay with the current one before
 * anything is changed in the control system.
 */

export type ReplaySettings = {
  limit: number;
  /** `high` alarms at or above the limit, `low` at or below it. */
  direction?: 'high' | 'low';
  /** How far back inside the limit the value must come before the alarm clears, in value units. */
  deadband?: number;
  /** Consecutive samples beyond the limit that are ignored before the alarm is raised. */
  onDelay?: number;
  /** Consecutive samples inside the clear level that are ignored before the alarm clears. */
  offDelay?: number;
};

export type ReplayResult = {
  /** Times the alarm would have been raised. */
  count: number;
  /** Sample indexes at which it was raised. */
  activations: number[];
  /** Samples during which the alarm was standing. */
  activeSamples: number;
};

/** Counts alarm activations over `values` (oldest first). `null` samples are gaps and change nothing. */
export function replayAlarmCount(values: readonly (number | null)[], settings: ReplaySettings): ReplayResult {
  const { limit, direction = 'high', deadband = 0, onDelay = 0, offDelay = 0 } = settings;
  const beyond = (value: number): boolean => (direction === 'high' ? value >= limit : value <= limit);
  const cleared = (value: number): boolean => (direction === 'high' ? value < limit - deadband : value > limit + deadband);

  const activations: number[] = [];
  let active = false;
  let run = 0;
  let activeSamples = 0;

  values.forEach((value, index) => {
    if (value === null) {
      if (active) activeSamples += 1;
      return;
    }
    if (!active) {
      run = beyond(value) ? run + 1 : 0;
      if (run > onDelay) {
        active = true;
        run = 0;
        activations.push(index);
      }
    } else {
      run = cleared(value) ? run + 1 : 0;
      if (run > offDelay) {
        active = false;
        run = 0;
      }
    }
    if (active) activeSamples += 1;
  });

  return { count: activations.length, activations, activeSamples };
}

export type ReplayComparison = {
  current: ReplayResult;
  proposed: ReplayResult;
  /** Activations avoided by the proposal; negative when it would alarm more often. */
  avoided: number;
  /** Reduction in percent of the current count; `null` when the current setting never fired. */
  reductionPercent: number | null;
};

/** Replays the same values against the current and the proposed setting. */
export function compareSettings(values: readonly (number | null)[], current: ReplaySettings, proposed: ReplaySettings): ReplayComparison {
  const currentResult = replayAlarmCount(values, current);
  const proposedResult = replayAlarmCount(values, proposed);
  const avoided = currentResult.count - proposedResult.count;
  return {
    current: currentResult,
    proposed: proposedResult,
    avoided,
    reductionPercent: currentResult.count === 0 ? null : Math.round((avoided / currentResult.count) * 100),
  };
}
