/**
 * Alarm priority worked out from the two things that justify an alarm, in the manner of
 * ISA-18.2 and EEMUA 191: how bad it gets if nobody acts, and how long the operator has.
 */

export const CONSEQUENCES = ['minor', 'moderate', 'major', 'severe'] as const;
export type Consequence = (typeof CONSEQUENCES)[number];

export const URGENCIES = ['over-30', '10-30', '3-10', 'under-3'] as const;
export type Urgency = (typeof URGENCIES)[number];

export type AlarmPriority = 'none' | 'low' | 'medium' | 'high';

export const CONSEQUENCE_LABEL: Record<Consequence, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  severe: 'Severe',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  'over-30': 'Over 30 min',
  '10-30': '10 to 30 min',
  '3-10': '3 to 10 min',
  'under-3': 'Under 3 min',
};

export const PRIORITY_LABEL: Record<AlarmPriority, string> = {
  none: 'Not an alarm',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const MATRIX: Record<Consequence, Record<Urgency, AlarmPriority>> = {
  minor: { 'over-30': 'none', '10-30': 'low', '3-10': 'low', 'under-3': 'low' },
  moderate: { 'over-30': 'none', '10-30': 'low', '3-10': 'medium', 'under-3': 'medium' },
  major: { 'over-30': 'low', '10-30': 'medium', '3-10': 'medium', 'under-3': 'high' },
  severe: { 'over-30': 'low', '10-30': 'medium', '3-10': 'high', 'under-3': 'high' },
};

/** The priority a consequence and a time to respond justify. `none` means: make it an event, not an alarm. */
export function derivePriority(consequence: Consequence, urgency: Urgency): AlarmPriority {
  return MATRIX[consequence][urgency];
}

/** The urgency class a time to respond in minutes falls in. */
export function urgencyOf(minutes: number): Urgency {
  if (minutes < 3) return 'under-3';
  if (minutes < 10) return '3-10';
  if (minutes <= 30) return '10-30';
  return 'over-30';
}

export function isConsequence(value: unknown): value is Consequence {
  return CONSEQUENCES.some((item) => item === value);
}

export function isUrgency(value: unknown): value is Urgency {
  return URGENCIES.some((item) => item === value);
}
