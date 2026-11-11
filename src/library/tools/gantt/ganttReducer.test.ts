import { TURNAROUND_TASKS } from './ganttFixtures';
import { ganttReducer, initGanttState } from './ganttReducer';
import type { GanttAction, GanttState } from './ganttReducer';
import { dayFromDate } from './ganttScale';
import { byId } from './ganttScheduler';

const run = (state: GanttState, ...actions: GanttAction[]): GanttState => actions.reduce(ganttReducer, state);
const start = (): GanttState => initGanttState(TURNAROUND_TASKS);
const task = (state: GanttState, id: string) => {
  const found = byId(state.tasks).get(id);
  if (!found) throw new Error(id);
  return found;
};

describe('ganttReducer', () => {
  it('selects a task and announces it', () => {
    const state = run(start(), { type: 'select', id: 'ka1' });
    expect(state.selection).toBe('ka1');
    expect(state.message).toBe('Overhaul 1st stage compressor selected');
    expect(run(state, { type: 'select', id: null }).message).toBe('Selection cleared');
  });

  it('collapses and expands a group', () => {
    const collapsed = run(start(), { type: 'toggleCollapse', id: 'mech' });
    expect(collapsed.collapsed).toEqual(['mech']);
    expect(collapsed.message).toBe('Mechanical work collapsed');
    expect(run(collapsed, { type: 'toggleCollapse', id: 'mech' }).collapsed).toEqual([]);
  });

  it('switches zoom and the two overlays', () => {
    const state = run(start(), { type: 'setZoom', zoom: 'week' }, { type: 'toggleCritical' }, { type: 'toggleBaseline' });
    expect(state).toMatchObject({ zoom: 'week', critical: true, baseline: true });
    expect(state.message).toBe('Baseline shown');
    expect(run(state, { type: 'toggleCritical' }).message).toBe('Critical path hidden');
  });

  it('moves a task by a number of days from where the drag began, so repeated events do not add up', () => {
    const origin = task(start(), 'ka2').start;
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'ka2', days: 1 }, { type: 'drag', mode: 'move', id: 'ka2', days: 3 });
    expect(task(state, 'ka2').start).toBe(origin + 3);
    expect(state.message).toContain('Moved Overhaul 2nd stage compressor');
  });

  it('records one history step for a whole drag and restores it on undo', () => {
    const origin = task(start(), 'ka2').start;
    const dragged = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'ka2', days: 2 }, { type: 'drag', mode: 'move', id: 'ka2', days: 4 }, { type: 'endEdit' });
    expect(dragged.past).toHaveLength(1);
    expect(dragged.edit).toBeNull();
    expect(task(run(dragged, { type: 'undo' }), 'ka2').start).toBe(origin);
  });

  it('records nothing when a drag ends where it began', () => {
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'ka2', days: 2 }, { type: 'drag', mode: 'move', id: 'ka2', days: 0 }, { type: 'endEdit' });
    expect(state.past).toHaveLength(0);
  });

  it('pushes successors during a drag and says how many', () => {
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'end', id: 'ka1', days: 3 });
    expect(task(state, 'ka1').duration).toBe(13);
    expect(task(state, 'fw').start).toBe(dayFromDate(2026, 3, 29));
    expect(state.message).toMatch(/\d+ later tasks pushed/);
  });

  it('clamps a move that would break a dependency and explains why', () => {
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'ka1', days: -5 });
    expect(task(state, 'ka1').start).toBe(dayFromDate(2026, 3, 16));
    expect(state.conflict).toBe('Overhaul 1st stage compressor cannot start before Turnaround starts finishes. Earliest start is 16 Mar.');
    expect(state.message).toBe(state.conflict);
    expect(run(state, { type: 'dismissConflict' }).conflict).toBeNull();
  });

  it('resizes from the start edge', () => {
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'start', id: 'va', days: 1 });
    expect(task(state, 'va')).toMatchObject({ start: dayFromDate(2026, 3, 18), duration: 3 });
  });

  it('moves a whole group', () => {
    const origin = task(start(), 'ha').start;
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'mech', days: 2 });
    expect(task(state, 'ha').start).toBe(origin + 2);
    expect(task(state, 'ka1').start).toBe(dayFromDate(2026, 3, 18));
  });

  it('cancels a drag and puts the plan back', () => {
    const state = run(start(), { type: 'beginEdit' }, { type: 'drag', mode: 'move', id: 'ka2', days: 3 }, { type: 'cancelEdit' });
    expect(state.tasks).toBe(TURNAROUND_TASKS);
    expect(state.message).toBe('Change cancelled');
    expect(run(start(), { type: 'cancelEdit' }).message).toBe('');
  });

  it('nudges a task by a day from the keyboard as one undo step', () => {
    const origin = task(start(), 'ka2').start;
    const state = run(start(), { type: 'nudge', mode: 'move', id: 'ka2', days: 1 });
    expect(task(state, 'ka2').start).toBe(origin + 1);
    expect(state.past).toHaveLength(1);
    expect(task(run(state, { type: 'undo' }), 'ka2').start).toBe(origin);
  });

  it('resizes the end by a day from the keyboard and keeps one day at least', () => {
    expect(task(run(start(), { type: 'nudge', mode: 'end', id: 'ka2', days: 1 }), 'ka2').duration).toBe(9);
    expect(task(run(start(), { type: 'nudge', mode: 'end', id: 'perm', days: -5 }), 'perm').duration).toBe(1);
  });

  it('says so and adds no history when a nudge is refused', () => {
    const state = run(start(), { type: 'nudge', mode: 'move', id: 'ka1', days: -1 });
    expect(state.past).toHaveLength(0);
    expect(state.conflict).toContain('cannot start before');
  });

  it('undoes and redoes, and drops redo after a new change', () => {
    const moved = run(start(), { type: 'nudge', mode: 'move', id: 'ka2', days: 1 });
    const undone = run(moved, { type: 'undo' });
    expect(undone.tasks).toBe(TURNAROUND_TASKS);
    expect(run(undone, { type: 'redo' }).tasks).toEqual(moved.tasks);
    expect(run(undone, { type: 'nudge', mode: 'move', id: 'ha', days: 1 }).future).toEqual([]);
  });

  it('does nothing to undo or redo with empty history', () => {
    const state = start();
    expect(run(state, { type: 'undo' })).toBe(state);
    expect(run(state, { type: 'redo' })).toBe(state);
  });

  it('keeps at most 50 history steps', () => {
    let state = start();
    for (let i = 0; i < 60; i += 1) state = ganttReducer(state, { type: 'nudge', mode: 'move', id: 'ha', days: i % 2 === 0 ? 1 : -1 });
    expect(state.past).toHaveLength(50);
  });
});
