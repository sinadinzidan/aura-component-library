import { dayFromDate } from './ganttScale';
import type { GanttTask } from './ganttScheduler';

const d = (month: number, date: number): number => dayFromDate(2026, month, date);

function task(id: string, name: string, parentId: string | null, start: number, duration: number, progress: number, resource: string | undefined, after: string[] = [], baselineShift = 0): GanttTask {
  return { id, name, parentId, kind: duration === 0 ? 'milestone' : 'task', start, duration, progress, resource, after, baseline: { start: start - baselineShift, duration } };
}

const group = (id: string, name: string, parentId: string | null = null): GanttTask => ({ id, name, parentId, kind: 'group', start: 0, duration: 0, progress: 0, after: [] });

/** Fixed reference date of all plant mock data: 12 March 2026. */
export const GANTT_TODAY = d(3, 12);

/**
 * Turnaround of the gas compression train at Nordkapp, 2 March to 4 April 2026. Some tasks run
 * later than baseline, which the baseline bars show.
 */
export const TURNAROUND_TASKS: readonly GanttTask[] = [
  group('prep', 'Preparation'),
  task('scope', 'Freeze work scope', 'prep', d(3, 2), 3, 100, 'Planning', [], 0),
  task('perm', 'Issue work permits', 'prep', d(3, 5), 2, 100, 'Operations', ['scope']),
  task('mat', 'Receive spares and scaffolding', 'prep', d(3, 5), 5, 100, 'Logistics', ['scope'], 1),
  group('iso', 'Shutdown and isolation'),
  task('shut', 'Shut down compression train', 'iso', d(3, 12), 1, 60, 'Operations', ['perm', 'mat'], 2),
  task('depr', 'Depressurise and purge', 'iso', d(3, 13), 2, 0, 'Operations', ['shut']),
  task('loto', 'Lock out and tag out', 'iso', d(3, 15), 1, 0, 'Operations', ['depr']),
  task('start', 'Turnaround starts', 'iso', d(3, 16), 0, 0, undefined, ['loto']),
  group('mech', 'Mechanical work'),
  task('ka1', 'Overhaul 1st stage compressor', 'mech', d(3, 16), 10, 0, 'Rotating crew', ['start'], 2),
  task('ka2', 'Overhaul 2nd stage compressor', 'mech', d(3, 16), 8, 0, 'Rotating crew B', ['start']),
  task('ha', 'Clean interstage cooler bundle', 'mech', d(3, 16), 6, 0, 'Static crew', ['start']),
  task('va', 'Inspect inlet separator internals', 'mech', d(3, 17), 4, 0, 'Inspection', ['start']),
  group('inst', 'Instruments and controls'),
  task('cal', 'Calibrate transmitters', 'inst', d(3, 18), 5, 0, 'Instrument crew', ['start']),
  task('fw', 'Upgrade turbine control firmware', 'inst', d(3, 26), 4, 0, 'Automation', ['ka1']),
  group('rec', 'Recommissioning'),
  task('box', 'Box up and leak test', 'rec', d(3, 26), 3, 0, 'Rotating crew', ['ka1', 'ka2', 'ha', 'va']),
  task('pur', 'Purge and re-pressurise', 'rec', d(3, 30), 2, 0, 'Operations', ['box', 'fw', 'cal']),
  task('run', 'Start up and trial run', 'rec', d(4, 1), 3, 0, 'Operations', ['pur']),
  task('hand', 'Handover to production', 'rec', d(4, 4), 0, 0, undefined, ['run']),
];

/** A maintenance week: inspections and repairs across the plant, 9 to 13 March 2026. */
export const MAINTENANCE_WEEK_TASKS: readonly GanttTask[] = [
  group('week', 'Week 11 maintenance'),
  task('wo1', 'Inspect recompressor drive-end bearing', 'week', d(3, 9), 2, 70, 'Tomás Barros', []),
  task('wo2', 'Replace bearing temperature transmitter', 'week', d(3, 10), 1, 0, 'Jonas Nyberg', []),
  task('wo3', 'Vibration survey, 1st stage compressor', 'week', d(3, 11), 1, 0, 'Aisha Khan', ['wo1']),
  task('wo4', 'Clean cooler tube bundle', 'week', d(3, 11), 2, 0, 'Magnus Solberg', []),
  task('wo5', 'Standby start test, export pump B', 'week', d(3, 12), 1, 0, 'Tomás Barros', ['wo3']),
  task('wo6', 'Review findings with operations', 'week', d(3, 13), 0, 0, undefined, ['wo4', 'wo5']),
];

/** The turnaround with one broken dependency: the 2nd stage overhaul starts before the isolation is done. */
export const CONFLICT_TASKS: readonly GanttTask[] = TURNAROUND_TASKS.map((candidate) => (candidate.id === 'ka2' ? { ...candidate, start: d(3, 14) } : candidate));
