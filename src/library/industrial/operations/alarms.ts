/**
 * Alarm vocabulary shared by the operations components: the record shape, the four alarm states
 * and the pure helpers that sort and count alarms. Shapes are structural, so a CDF event or a
 * mock record with the same fields passes straight in.
 */
import type { Severity } from '../status';

export type AlarmState = 'active' | 'acknowledged' | 'shelved' | 'cleared';

export type OperationsAlarm = {
  id: string;
  severity: Severity;
  /** Alarm text as an operator reads it. */
  message: string;
  /** Instrument tag that raised the alarm. */
  sensorTag: string;
  state: AlarmState;
  /** Epoch milliseconds. */
  raisedAt: number;
  /** Value at the time of the alarm, formatted with its unit. */
  value: string;
  /** Limit that was crossed, formatted with its unit. */
  limit: string;
};

export const SEVERITY_ORDER: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const ALARM_STATE_LABEL: Record<AlarmState, string> = {
  active: 'Unacknowledged',
  acknowledged: 'Acknowledged',
  shelved: 'Shelved',
  cleared: 'Cleared',
};

export const alarmStateLabel = (state: AlarmState): string => ALARM_STATE_LABEL[state];

/** Still standing in the plant: not cleared, whether or not someone has seen it. */
export const isOpenAlarm = (alarm: Pick<OperationsAlarm, 'state'>): boolean =>
  alarm.state === 'active' || alarm.state === 'acknowledged';

/** Most severe first; within a severity, the newest first. Does not mutate the input. */
export function sortAlarmsBySeverity<T extends Pick<OperationsAlarm, 'severity' | 'raisedAt'>>(alarms: readonly T[]): T[] {
  return [...alarms].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.raisedAt - a.raisedAt
  );
}

/** How many alarms there are of each severity. Every severity is present, zero included. */
export function countBySeverity(alarms: readonly Pick<OperationsAlarm, 'severity'>[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const alarm of alarms) counts[alarm.severity] += 1;
  return counts;
}

/** The most severe severity in a list, or `undefined` for an empty list. */
export function worstSeverity(severities: readonly Severity[]): Severity | undefined {
  return SEVERITY_ORDER.find((severity) => severities.includes(severity));
}
