import { formatClock, weekdayName, weekdayOf } from './timeMath';

/** An item on the calendar: a maintenance job, a permit window or a meeting. */
export type SchedEvent = {
  id: string;
  title: string;
  /** ISO date. */
  dayId: string;
  /** The crew that does it. */
  resourceId: string;
  /** Minutes from midnight. Ignored for all-day items. */
  start: number;
  end: number;
  /** Shown in the all-day row; never conflicts. */
  allDay?: boolean;
  /** Jobs occupy their crew; permits and meetings do not. */
  kind: 'job' | 'permit' | 'meeting';
  /** Asset tag or permit number, set in monospace. */
  reference?: string;
};

export type WorkingHours = {
  /** Days of the week the crew works, 0 for Sunday. */
  weekdays: readonly number[];
  start: number;
  end: number;
};

export type ConflictRules = {
  /** By resource id. A resource without an entry has no working-hours limit. */
  hours: Readonly<Record<string, WorkingHours>>;
  /** Crew names by id, for the reason text. */
  names: Readonly<Record<string, string>>;
};

export type Conflict = {
  kind: 'double-booked' | 'outside-hours';
  /** The reason in words, for a tooltip, a panel or a form. */
  message: string;
  /** The other item, for a double booking. */
  otherId?: string;
};

const overlaps = (a: Pick<SchedEvent, 'start' | 'end'>, b: Pick<SchedEvent, 'start' | 'end'>): boolean => a.start < b.end && b.start < a.end;

/** Conflicts one item would have against `others`, ignoring the item itself. */
export function conflictsOf(candidate: Omit<SchedEvent, 'id'> & { id?: string }, others: readonly SchedEvent[], rules: ConflictRules): Conflict[] {
  if (candidate.allDay) return [];
  const found: Conflict[] = [];
  const crew = rules.names[candidate.resourceId] ?? candidate.resourceId;

  if (candidate.kind === 'job') {
    for (const other of others) {
      if (other.id === candidate.id || other.allDay || other.kind !== 'job') continue;
      if (other.resourceId === candidate.resourceId && other.dayId === candidate.dayId && overlaps(candidate, other)) {
        found.push({ kind: 'double-booked', otherId: other.id, message: `${crew} is already booked for “${other.title}”, ${formatClock(other.start)}–${formatClock(other.end)}` });
      }
    }
  }

  const hours = rules.hours[candidate.resourceId];
  if (hours && candidate.kind === 'job') {
    const weekday = weekdayOf(candidate.dayId);
    if (weekday !== null && !hours.weekdays.includes(weekday)) {
      found.push({ kind: 'outside-hours', message: `${crew} does not work on ${weekdayName(candidate.dayId)}s` });
    } else if (candidate.start < hours.start || candidate.end > hours.end) {
      found.push({ kind: 'outside-hours', message: `Outside working hours: ${crew} works ${formatClock(hours.start)}–${formatClock(hours.end)}` });
    }
  }
  return found;
}

/** Conflicts of every item, by item id. Items without a conflict have no entry. */
export function findConflicts(events: readonly SchedEvent[], rules: ConflictRules): Record<string, Conflict[]> {
  const result: Record<string, Conflict[]> = {};
  for (const event of events) {
    const conflicts = conflictsOf(event, events, rules);
    if (conflicts.length > 0) result[event.id] = conflicts;
  }
  return result;
}
