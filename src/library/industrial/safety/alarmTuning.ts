/**
 * Starting points for alarm deadband and delay by signal type, after the guidance in EEMUA 191
 * and ISA-18.2. They are where a review starts, not a substitute for looking at the trend.
 */

export type SignalType = 'flow' | 'level' | 'pressure' | 'temperature';

export const SIGNAL_TYPES: readonly SignalType[] = ['flow', 'level', 'pressure', 'temperature'];

export const SIGNAL_TYPE_LABEL: Record<SignalType, string> = { flow: 'Flow', level: 'Level', pressure: 'Pressure', temperature: 'Temperature' };

const DEFAULTS: Record<SignalType, { deadbandPercent: number; delaySeconds: number }> = {
  flow: { deadbandPercent: 5, delaySeconds: 15 },
  level: { deadbandPercent: 5, delaySeconds: 60 },
  pressure: { deadbandPercent: 2, delaySeconds: 15 },
  temperature: { deadbandPercent: 1, delaySeconds: 60 },
};

export type TuningSuggestion = {
  /** Deadband as percent of the instrument span. */
  deadbandPercent: number;
  /** The same deadband in the instrument's own unit. */
  deadband: number;
  /** On- and off-delay, in seconds. */
  delaySeconds: number;
};

/** Suggested deadband and delay for a signal of the given type and instrument span (range max − min). */
export function suggestTuning(signalType: SignalType, span: number): TuningSuggestion {
  const { deadbandPercent, delaySeconds } = DEFAULTS[signalType];
  const deadband = Math.round(Math.max(span, 0) * deadbandPercent) / 100;
  return { deadbandPercent, deadband, delaySeconds };
}

/** Whole samples a delay covers at a given sampling interval; at least 0. */
export function delayInSamples(delaySeconds: number, sampleSeconds: number): number {
  if (sampleSeconds <= 0) return 0;
  return Math.max(0, Math.floor(delaySeconds / sampleSeconds));
}
