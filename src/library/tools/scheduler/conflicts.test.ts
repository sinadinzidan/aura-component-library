import { conflictsOf, findConflicts } from './conflicts';
import type { ConflictRules, SchedEvent } from './conflicts';

const RULES: ConflictRules = {
  hours: {
    mechanical: { weekdays: [1, 2, 3, 4, 5], start: 7 * 60, end: 16 * 60 },
    operations: { weekdays: [0, 1, 2, 3, 4, 5, 6], start: 6 * 60, end: 18 * 60 },
  },
  names: { mechanical: 'Mechanical', operations: 'Operations', instrument: 'Instrument' },
};

function job(overrides: Partial<SchedEvent> = {}): SchedEvent {
  return { id: 'a', title: 'Inspect drive-end bearing', dayId: '2026-03-12', resourceId: 'mechanical', start: 8 * 60, end: 12 * 60, kind: 'job', ...overrides };
}

describe('conflictsOf', () => {
  it('has no conflict for a lone job inside working hours', () => {
    expect(conflictsOf(job(), [job()], RULES)).toEqual([]);
  });

  it('flags a double booking of the same crew with the other job named', () => {
    const other = job({ id: 'b', title: 'Vibration survey', start: 11 * 60, end: 13 * 60 });
    const [conflict] = conflictsOf(job(), [job(), other], RULES);
    expect(conflict).toMatchObject({ kind: 'double-booked', otherId: 'b' });
    expect(conflict.message).toBe('Mechanical is already booked for “Vibration survey”, 11:00–13:00');
  });

  it('does not flag jobs that only touch', () => {
    const other = job({ id: 'b', start: 12 * 60, end: 14 * 60 });
    expect(conflictsOf(job(), [job(), other], RULES)).toEqual([]);
  });

  it('does not flag different crews or different days', () => {
    expect(conflictsOf(job(), [job(), job({ id: 'b', resourceId: 'operations' })], RULES)).toEqual([]);
    expect(conflictsOf(job(), [job(), job({ id: 'c', dayId: '2026-03-13' })], RULES)).toEqual([]);
  });

  it('does not count permits, meetings or all-day items as bookings', () => {
    const others = [job({ id: 'p', kind: 'permit' }), job({ id: 'm', kind: 'meeting' }), job({ id: 'd', allDay: true })];
    expect(conflictsOf(job(), others, RULES)).toEqual([]);
  });

  it('flags a job before or after working hours', () => {
    expect(conflictsOf(job({ start: 6 * 60 }), [], RULES)[0].message).toBe('Outside working hours: Mechanical works 07:00–16:00');
    expect(conflictsOf(job({ end: 17 * 60 }), [], RULES)[0].kind).toBe('outside-hours');
  });

  it('flags a job on a day the crew does not work', () => {
    expect(conflictsOf(job({ dayId: '2026-03-14' }), [], RULES)[0].message).toBe('Mechanical does not work on Saturdays');
  });

  it('allows a crew that works every day', () => {
    expect(conflictsOf(job({ resourceId: 'operations', dayId: '2026-03-15', start: 7 * 60, end: 9 * 60 }), [], RULES)).toEqual([]);
  });

  it('has no hours limit for a crew without rules, and none for permits', () => {
    expect(conflictsOf(job({ resourceId: 'instrument', start: 3 * 60, end: 4 * 60 }), [], RULES)).toEqual([]);
    expect(conflictsOf(job({ kind: 'permit', start: 3 * 60, end: 4 * 60 }), [], RULES)).toEqual([]);
  });

  it('never flags an all-day item', () => {
    expect(conflictsOf(job({ allDay: true, dayId: '2026-03-14' }), [], RULES)).toEqual([]);
  });

  it('can report both reasons at once', () => {
    const other = job({ id: 'b', start: 5 * 60, end: 9 * 60 });
    const kinds = conflictsOf(job({ start: 6 * 60, end: 10 * 60 }), [other], RULES).map((conflict) => conflict.kind);
    expect(kinds).toEqual(['double-booked', 'outside-hours']);
  });

  it('checks a draft that has no id yet', () => {
    const draft = { title: 'New job', dayId: '2026-03-12', resourceId: 'mechanical', start: 9 * 60, end: 10 * 60, kind: 'job' as const };
    expect(conflictsOf(draft, [job()], RULES)[0].kind).toBe('double-booked');
  });
});

describe('findConflicts', () => {
  it('keys conflicts by item and leaves clean items out', () => {
    const events = [job(), job({ id: 'b', title: 'Vibration survey', start: 11 * 60, end: 13 * 60 }), job({ id: 'c', resourceId: 'operations', start: 8 * 60, end: 9 * 60 })];
    const result = findConflicts(events, RULES);
    expect(Object.keys(result)).toEqual(['a', 'b']);
    expect(result.a[0].otherId).toBe('b');
    expect(result.b[0].otherId).toBe('a');
  });

  it('is empty for no events', () => {
    expect(findConflicts([], RULES)).toEqual({});
  });
});
