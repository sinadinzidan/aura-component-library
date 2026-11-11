import { CONFLICT_TASKS, MAINTENANCE_WEEK_TASKS, TURNAROUND_TASKS } from './ganttFixtures';
import { dayFromDate } from './ganttScale';
import {
  byId,
  criticalPath,
  earliestStart,
  end,
  findConflicts,
  hasCycle,
  leavesOf,
  moveTask,
  planSpan,
  pushSuccessors,
  resizeEnd,
  resizeStart,
  rollUp,
  shiftGroup,
  visibleRows,
} from './ganttScheduler';
import type { GanttTask } from './ganttScheduler';

const t = (id: string, start: number, duration: number, after: string[] = [], extra: Partial<GanttTask> = {}): GanttTask => ({
  id,
  name: id,
  parentId: null,
  kind: duration === 0 ? 'milestone' : 'task',
  start,
  duration,
  progress: 0,
  after,
  ...extra,
});

/** a(0..3) → b(3..5) → c(5..6), plus a free task f. */
const CHAIN: GanttTask[] = [t('a', 0, 3), t('b', 3, 2, ['a']), t('c', 5, 1, ['b']), t('f', 0, 2)];
const get = (tasks: readonly GanttTask[], id: string): GanttTask => {
  const found = byId(tasks).get(id);
  if (!found) throw new Error(id);
  return found;
};

describe('earliestStart and conflicts', () => {
  it('is the latest end among predecessors, or null without any', () => {
    expect(earliestStart(CHAIN, 'b')).toBe(3);
    expect(earliestStart(CHAIN, 'a')).toBeNull();
    expect(earliestStart([...CHAIN, t('d', 0, 1, ['a', 'c'])], 'd')).toBe(6);
  });

  it('can ignore predecessors inside a set', () => {
    expect(earliestStart(CHAIN, 'b', new Set(['a']))).toBeNull();
  });

  it('finds no conflicts in a consistent plan', () => {
    expect(findConflicts(CHAIN)).toEqual([]);
    expect(findConflicts(TURNAROUND_TASKS)).toEqual([]);
    expect(findConflicts(MAINTENANCE_WEEK_TASKS)).toEqual([]);
  });

  it('reports a successor that starts before its predecessor ends, with the overlap', () => {
    const broken = CHAIN.map((task) => (task.id === 'b' ? { ...task, start: 2 } : task));
    expect(findConflicts(broken)).toEqual([{ taskId: 'b', predecessorId: 'a', overlap: 1 }]);
    expect(findConflicts(CONFLICT_TASKS).map((conflict) => conflict.taskId)).toEqual(['ka2']);
  });

  it('detects dependency loops', () => {
    expect(hasCycle(CHAIN)).toBe(false);
    expect(hasCycle([t('a', 0, 1, ['b']), t('b', 1, 1, ['a'])])).toBe(true);
  });
});

describe('pushSuccessors', () => {
  it('pushes the chain later when a predecessor now ends later', () => {
    const longer = CHAIN.map((task) => (task.id === 'a' ? { ...task, duration: 5 } : task));
    const { tasks, pushed } = pushSuccessors(longer, ['a']);
    expect(get(tasks, 'b').start).toBe(5);
    expect(get(tasks, 'c').start).toBe(7);
    expect(pushed.sort()).toEqual(['b', 'c']);
  });

  it('never pulls a successor earlier', () => {
    const shorter = CHAIN.map((task) => (task.id === 'a' ? { ...task, duration: 1 } : task));
    expect(get(pushSuccessors(shorter, ['a']).tasks, 'b').start).toBe(3);
  });

  it('terminates on a loop', () => {
    const loop = [t('a', 0, 1, ['b']), t('b', 0, 1, ['a'])];
    expect(pushSuccessors(loop, ['a']).tasks).toHaveLength(2);
  });

  it('does not change its input', () => {
    pushSuccessors(CHAIN, ['a']);
    expect(get(CHAIN, 'b').start).toBe(3);
  });
});

describe('moveTask', () => {
  it('moves a task later and pushes its successors by the same overlap', () => {
    const { tasks, pushed, conflict } = moveTask(CHAIN, 'a', 2);
    expect(get(tasks, 'a').start).toBe(2);
    expect(get(tasks, 'b').start).toBe(5);
    expect(get(tasks, 'c').start).toBe(7);
    expect(pushed.sort()).toEqual(['b', 'c']);
    expect(conflict).toBeNull();
  });

  it('refuses to start before the predecessor ends and reports it', () => {
    const { tasks, conflict } = moveTask(CHAIN, 'b', 1);
    expect(get(tasks, 'b').start).toBe(3);
    expect(conflict).toEqual({ taskId: 'b', predecessorId: 'a', earliest: 3 });
  });

  it('moves a free task anywhere, including earlier', () => {
    const { tasks, conflict } = moveTask(CHAIN, 'f', -4);
    expect(get(tasks, 'f').start).toBe(-4);
    expect(conflict).toBeNull();
  });

  it('allows a successor to move later with a gap', () => {
    const { tasks, pushed } = moveTask(CHAIN, 'b', 6);
    expect(get(tasks, 'b').start).toBe(6);
    expect(get(tasks, 'c').start).toBe(8);
    expect(pushed).toEqual(['c']);
  });

  it('ignores an unknown id', () => {
    expect(moveTask(CHAIN, 'nope', 4).tasks).toEqual(CHAIN);
  });

  it('keeps a milestone ahead of its predecessor', () => {
    const plan = [t('a', 0, 3), t('m', 3, 0, ['a'])];
    expect(get(moveTask(plan, 'm', 1).tasks, 'm').start).toBe(3);
    expect(get(moveTask(plan, 'a', 2).tasks, 'm').start).toBe(5);
  });
});

describe('resizeEnd and resizeStart', () => {
  it('lengthens a task and pushes the successors', () => {
    const { tasks } = resizeEnd(CHAIN, 'a', 5);
    expect(get(tasks, 'a').duration).toBe(5);
    expect(get(tasks, 'b').start).toBe(5);
  });

  it('shortens a task but never below one day', () => {
    expect(get(resizeEnd(CHAIN, 'a', 0).tasks, 'a').duration).toBe(1);
    expect(get(resizeEnd(CHAIN, 'a', 2).tasks, 'a').duration).toBe(2);
  });

  it('does not resize a milestone or a group', () => {
    const plan = [t('a', 0, 3), t('m', 3, 0, ['a'])];
    expect(resizeEnd(plan, 'm', 6).tasks).toEqual(plan);
    expect(resizeStart(plan, 'm', 1).tasks).toEqual(plan);
  });

  it('moves the start earlier and keeps the end, down to the predecessor', () => {
    const plan = [t('a', 0, 3), t('b', 5, 3, ['a'])];
    const { tasks, conflict } = resizeStart(plan, 'b', 4);
    expect(get(tasks, 'b')).toMatchObject({ start: 4, duration: 4 });
    expect(conflict).toBeNull();

    const clamped = resizeStart(plan, 'b', 1);
    expect(get(clamped.tasks, 'b')).toMatchObject({ start: 3, duration: 5 });
    expect(clamped.conflict).toEqual({ taskId: 'b', predecessorId: 'a', earliest: 3 });
  });

  it('moves the start later and shortens the task, keeping at least one day', () => {
    expect(get(resizeStart(CHAIN, 'a', 2).tasks, 'a')).toMatchObject({ start: 2, duration: 1 });
    expect(get(resizeStart(CHAIN, 'a', 9).tasks, 'a')).toMatchObject({ start: 2, duration: 1 });
  });
});

describe('groups', () => {
  const GROUPED: GanttTask[] = [
    { id: 'g', name: 'Group', parentId: null, kind: 'group', start: 0, duration: 0, progress: 0, after: [] },
    t('x', 2, 4, [], { parentId: 'g', progress: 100 }),
    t('y', 6, 2, ['x'], { parentId: 'g', progress: 0 }),
    t('z', 8, 1, ['y']),
  ];

  it('lists the leaves under a group', () => {
    expect(leavesOf(GROUPED, 'g').map((leaf) => leaf.id)).toEqual(['x', 'y']);
    expect(leavesOf(GROUPED, 'x').map((leaf) => leaf.id)).toEqual(['x']);
    expect(leavesOf(GROUPED, 'none')).toEqual([]);
  });

  it('rolls up span and duration-weighted progress', () => {
    const summary = rollUp(GROUPED).get('g');
    expect(summary).toEqual({ start: 2, end: 8, progress: 67 });
    expect(rollUp(GROUPED).get('x')).toEqual({ start: 2, end: 6, progress: 100 });
  });

  it('moves every leaf of a group and pushes what follows it', () => {
    const { tasks, pushed } = shiftGroup(GROUPED, 'g', 3);
    expect(get(tasks, 'x').start).toBe(5);
    expect(get(tasks, 'y').start).toBe(9);
    expect(get(tasks, 'z').start).toBe(11);
    expect(pushed).toEqual(['z']);
  });

  it('moves a group when asked to move it to a start', () => {
    expect(get(moveTask(GROUPED, 'g', 4).tasks, 'x').start).toBe(4);
  });

  it('stops a group short of its outside predecessors when moved earlier', () => {
    const plan = [t('pre', 0, 1), ...GROUPED.map((task) => (task.id === 'x' ? { ...task, after: ['pre'] } : task))];
    const { tasks, conflict } = shiftGroup(plan, 'g', -4);
    expect(get(tasks, 'x').start).toBe(1);
    expect(get(tasks, 'y').start).toBe(5);
    expect(conflict).toMatchObject({ taskId: 'x', earliest: 1 });
  });

  it('keeps the order inside a group when it moves earlier', () => {
    const { tasks } = shiftGroup(GROUPED, 'g', -2);
    expect(get(tasks, 'x').start).toBe(0);
    expect(get(tasks, 'y').start).toBe(4);
  });
});

describe('criticalPath', () => {
  it('marks the longest chain and gives other tasks float', () => {
    const plan = [t('a', 0, 3), t('b', 3, 4, ['a']), t('c', 3, 1, ['a']), t('d', 7, 1, ['b', 'c'])];
    const { critical, float, finish } = criticalPath(plan);
    expect([...critical].sort()).toEqual(['a', 'b', 'd']);
    expect(float.get('c')).toBe(3);
    expect(finish).toBe(8);
  });

  it('counts a task that starts later than its predecessors allow as the start of its chain', () => {
    const { critical } = criticalPath([t('a', 0, 2), t('b', 5, 2, ['a'])]);
    expect([...critical]).toEqual(['b']);
  });

  it('is empty for no tasks and ignores groups', () => {
    expect(criticalPath([]).finish).toBe(0);
    const { critical } = criticalPath(TURNAROUND_TASKS);
    expect(TURNAROUND_TASKS.filter((task) => task.kind === 'group').some((task) => critical.has(task.id))).toBe(false);
  });

  it('runs through the turnaround from isolation to handover', () => {
    const { critical, finish } = criticalPath(TURNAROUND_TASKS);
    for (const id of ['shut', 'depr', 'loto', 'start', 'ka1', 'fw', 'pur', 'run', 'hand']) expect(critical.has(id)).toBe(true);
    expect(critical.has('ka2')).toBe(false);
    expect(critical.has('box')).toBe(false);
    expect(finish).toBe(dayFromDate(2026, 4, 4));
  });

  it('survives a loop without hanging', () => {
    expect(criticalPath([t('a', 0, 1, ['b']), t('b', 1, 1, ['a'])]).finish).toBeGreaterThan(0);
  });
});

describe('rows and span', () => {
  it('lists tasks in outline order with depth', () => {
    const rows = visibleRows(TURNAROUND_TASKS, new Set());
    expect(rows[0]).toMatchObject({ depth: 0, hasChildren: true });
    expect(rows[1].task.id).toBe('scope');
    expect(rows[1].depth).toBe(1);
    expect(rows).toHaveLength(TURNAROUND_TASKS.length);
  });

  it('hides the children of a collapsed group', () => {
    const rows = visibleRows(TURNAROUND_TASKS, new Set(['prep']));
    expect(rows[0].collapsed).toBe(true);
    expect(rows.map((row) => row.task.id)).not.toContain('scope');
    expect(rows).toHaveLength(TURNAROUND_TASKS.length - 3);
  });

  it('spans the plan including baselines', () => {
    const span = planSpan([t('a', 5, 2, [], { baseline: { start: 3, duration: 2 } }), t('b', 6, 6)]);
    expect(span).toEqual({ start: 3, end: 12 });
  });

  it('leaves groups out of the span, which have no dates of their own', () => {
    expect(planSpan(TURNAROUND_TASKS).start).toBe(dayFromDate(2026, 3, 2));
    expect(planSpan([])).toEqual({ start: 0, end: 0 });
  });

  it('ends a task the day after its last working day', () => {
    expect(end({ start: 4, duration: 3 })).toBe(7);
  });
});
