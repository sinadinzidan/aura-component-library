import type { StatusDescriptor } from '../status';

/**
 * Alarm prioritisation in the style of ISA-18.2 and EEMUA 191: the priority of an alarm follows
 * from how bad the consequence of not responding is and how long the operator has to respond.
 * The grid below is an example; a site's alarm philosophy document sets its own.
 */

/** Worst credible consequence if the operator does not act. `none` means there is nothing to prevent. */
export type ConsequenceSeverity = 'none' | 'minor' | 'major' | 'severe';

/** How long the operator has from the alarm to the consequence. */
export type ResponseClass = 'over-30' | '10-to-30' | '3-to-10' | 'under-3';

/** `none` is the outcome "this should not be an alarm". */
export type AlarmPriority = 'none' | 'low' | 'medium' | 'high';

export const CONSEQUENCE_SEVERITIES: readonly ConsequenceSeverity[] = ['none', 'minor', 'major', 'severe'];
export const RESPONSE_CLASSES: readonly ResponseClass[] = ['over-30', '10-to-30', '3-to-10', 'under-3'];
/** The priorities an annunciated alarm can have, lowest first. */
export const ALARM_PRIORITIES: readonly Exclude<AlarmPriority, 'none'>[] = ['low', 'medium', 'high'];

export const SEVERITY_LABEL: Record<ConsequenceSeverity, string> = {
  none: 'No consequence',
  minor: 'Minor',
  major: 'Major',
  severe: 'Severe',
};

export const RESPONSE_LABEL: Record<ResponseClass, string> = {
  'over-30': 'Over 30 min',
  '10-to-30': '10 to 30 min',
  '3-to-10': '3 to 10 min',
  'under-3': 'Under 3 min',
};

/** Below this the operator cannot be the protection: the response has to be automatic. */
export const MIN_OPERATOR_RESPONSE_MINUTES = 1;

const MATRIX: Record<ResponseClass, Record<ConsequenceSeverity, AlarmPriority>> = {
  'over-30': { none: 'none', minor: 'none', major: 'low', severe: 'medium' },
  '10-to-30': { none: 'none', minor: 'low', major: 'low', severe: 'medium' },
  '3-to-10': { none: 'none', minor: 'low', major: 'medium', severe: 'high' },
  'under-3': { none: 'none', minor: 'medium', major: 'high', severe: 'high' },
};

const PRIORITY_STATUS: Record<AlarmPriority, StatusDescriptor> = {
  none: { tone: 'neutral', label: 'Not an alarm', shape: 'ring' },
  low: { tone: 'info', label: 'Low', shape: 'dot' },
  medium: { tone: 'warning', label: 'Medium', shape: 'square' },
  high: { tone: 'critical', label: 'High', shape: 'diamond' },
};

/** Tone, word and shape of an alarm priority. */
export const alarmPriorityStatus = (priority: AlarmPriority): StatusDescriptor => PRIORITY_STATUS[priority];

/** The band a time to respond falls in. Boundaries belong to the longer band: 30 min is "10 to 30". */
export function responseClass(minutes: number): ResponseClass {
  if (minutes > 30) return 'over-30';
  if (minutes >= 10) return '10-to-30';
  if (minutes >= 3) return '3-to-10';
  return 'under-3';
}

/** Priority from consequence severity and the time available to respond, in minutes. */
export function alarmPriority(severity: ConsequenceSeverity, minutesToRespond: number): AlarmPriority {
  return MATRIX[responseClass(minutesToRespond)][severity];
}

/** One cell of the grid, for drawing the matrix itself. */
export function matrixCell(severity: ConsequenceSeverity, response: ResponseClass): AlarmPriority {
  return MATRIX[response][severity];
}

export type Rationalisation = {
  response: ResponseClass;
  priority: AlarmPriority;
  /** Set when the result needs a remark: no consequence, too much time, or too little. */
  finding?: string;
};

/** The worksheet outcome for one alarm: its priority and the remark a reviewer would add. */
export function rationalise(severity: ConsequenceSeverity, minutesToRespond: number): Rationalisation {
  const response = responseClass(minutesToRespond);
  const priority = MATRIX[response][severity];
  if (severity === 'none') return { response, priority, finding: 'No consequence to prevent. Remove the alarm or record it as an event.' };
  if (minutesToRespond < MIN_OPERATOR_RESPONSE_MINUTES) {
    return { response, priority, finding: 'Less than 1 min to respond. The operator cannot be the protection; an automatic action is needed.' };
  }
  if (priority === 'none') return { response, priority, finding: 'Minor consequence with ample time. Use an alert or a shift report entry instead.' };
  return { response, priority };
}

/** Target share of annunciated alarms per priority, in percent (EEMUA 191: about 80 / 15 / 5). */
export const PRIORITY_TARGET: Record<Exclude<AlarmPriority, 'none'>, number> = { low: 80, medium: 15, high: 5 };

export type PriorityShare = {
  priority: Exclude<AlarmPriority, 'none'>;
  count: number;
  /** Share of configured alarms, 0–100, one decimal. */
  share: number;
  target: number;
  /** Share minus target, in percentage points. */
  delta: number;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Share of each priority against its target. Entries with priority `none` are not alarms and are left out. */
export function priorityDistribution(priorities: readonly AlarmPriority[]): PriorityShare[] {
  const total = priorities.filter((priority) => priority !== 'none').length;
  return ALARM_PRIORITIES.map((priority) => {
    const count = priorities.filter((entry) => entry === priority).length;
    const share = total === 0 ? 0 : round1((count / total) * 100);
    return { priority, count, share, target: PRIORITY_TARGET[priority], delta: round1(share - PRIORITY_TARGET[priority]) };
  });
}

/** Whether every priority is within `tolerance` percentage points of its target. */
export function isDistributionOnTarget(shares: readonly PriorityShare[], tolerance = 5): boolean {
  return shares.every((entry) => Math.abs(entry.delta) <= tolerance);
}
