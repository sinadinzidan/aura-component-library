/** Settings an alarm is replayed with: its limit and the two filters that stop it chattering. */
export type ReplaySettings = {
  /** The alarm raises when the value goes above this. */
  limit: number;
  /** The value must fall this far below the limit before the alarm clears. */
  deadband?: number;
  /** The value must stay above the limit for this many samples before the alarm raises. */
  delaySamples?: number;
};

export type ReplayResult = {
  /** How many times the alarm would have raised. */
  activations: number;
  /** Samples during which the alarm would have been standing. */
  standingSamples: number;
};

/**
 * Replays recorded values against alarm settings and counts what the operator would have seen.
 * Used to test a proposed limit, deadband or on-delay before it goes into a change request.
 */
export function replayAlarm(values: readonly number[], { limit, deadband = 0, delaySamples = 0 }: ReplaySettings): ReplayResult {
  let active = false;
  let above = 0;
  let activations = 0;
  let standingSamples = 0;

  for (const value of values) {
    if (active) {
      if (value < limit - deadband) {
        active = false;
        above = 0;
      }
    } else if (value > limit) {
      above += 1;
      if (above > delaySamples) {
        active = true;
        activations += 1;
      }
    } else {
      above = 0;
    }
    if (active) standingSamples += 1;
  }

  return { activations, standingSamples };
}
