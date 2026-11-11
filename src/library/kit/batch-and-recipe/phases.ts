import type { Tone } from '../tones';

export type TrackPhase = {
  id: string;
  label: string;
  /** Minutes the recipe allows. Sets the width of the phase. */
  expected: number;
  /** Minutes spent so far; `null` when the phase has not started. */
  actual: number | null;
  state: 'done' | 'current' | 'held' | 'upcoming';
};

/** Tone of a phase: a finished phase that ran more than a tenth over turns to warning. */
export function phaseTone(phase: TrackPhase): Tone {
  if (phase.state === 'held') return 'warning';
  if (phase.state === 'current') return 'info';
  if (phase.state === 'upcoming') return 'neutral';
  return phase.actual !== null && phase.actual > phase.expected * 1.1 ? 'warning' : 'success';
}
