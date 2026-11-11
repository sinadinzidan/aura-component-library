/**
 * The scheduling rules of a Gantt chart, as pure functions over plain data. Every dependency is
 * finish-to-start: a successor cannot start before its predecessor ends. Moving a task later
 * pushes its successors; moving it earlier than its predecessors allow is clamped and reported.
 */

export type GanttKind = 'task' | 'milestone' | 'group';

export type GanttTask = {
  id: string;
  name: string;
  parentId: string | null;
  kind: GanttKind;
  /** First day of the task, as a day number. Groups derive theirs from their children. */
  start: number;
  /** Days of work. A milestone is 0. */
  duration: number;
  /** 0 to 100. */
  progress: number;
  /** Crew or contractor. */
  resource?: string;
  /** Ids of tasks that must finish before this one starts. */
  after: readonly string[];
  /** The plan as first agreed, for comparison. */
  baseline?: { start: number; duration: number };
};

export const end = (task: Pick<GanttTask, 'start' | 'duration'>): number => task.start + task.duration;

export const byId = (tasks: readonly GanttTask[]): Map<string, GanttTask> => new Map(tasks.map((task) => [task.id, task]));

export const childrenOf = (tasks: readonly GanttTask[], id: string): GanttTask[] => tasks.filter((task) => task.parentId === id);

/** Every leaf (task or milestone) under a group, or the task itself when it is a leaf. */
export function leavesOf(tasks: readonly GanttTask[], id: string): GanttTask[] {
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task) return [];
  if (task.kind !== 'group') return [task];
  return childrenOf(tasks, id).flatMap((child) => leavesOf(tasks, child.id));
}

export type RolledUp = { start: number; end: number; progress: number };

/** Start, end and progress of every task; groups take the span and the duration-weighted progress of their leaves. */
export function rollUp(tasks: readonly GanttTask[]): Map<string, RolledUp> {
  const result = new Map<string, RolledUp>();
  for (const task of tasks) {
    if (task.kind !== 'group') {
      result.set(task.id, { start: task.start, end: end(task), progress: task.progress });
      continue;
    }
    const leaves = leavesOf(tasks, task.id);
    if (leaves.length === 0) {
      result.set(task.id, { start: task.start, end: end(task), progress: 0 });
      continue;
    }
    const weight = leaves.reduce((sum, leaf) => sum + Math.max(1, leaf.duration), 0);
    const done = leaves.reduce((sum, leaf) => sum + Math.max(1, leaf.duration) * leaf.progress, 0);
    result.set(task.id, { start: Math.min(...leaves.map((leaf) => leaf.start)), end: Math.max(...leaves.map(end)), progress: Math.round(done / weight) });
  }
  return result;
}

/** The earliest day a task may start: the latest end among its predecessors. `null` when it has none. */
export function earliestStart(tasks: readonly GanttTask[], id: string, ignore: ReadonlySet<string> = new Set()): number | null {
  const index = byId(tasks);
  const task = index.get(id);
  if (!task) return null;
  const ends = task.after.filter((pred) => !ignore.has(pred)).map((pred) => index.get(pred)).filter((pred): pred is GanttTask => pred !== undefined).map(end);
  return ends.length === 0 ? null : Math.max(...ends);
}

export type Conflict = { taskId: string; predecessorId: string; /** Days the task starts too early. */ overlap: number };

/** Dependencies that are broken right now: a successor that starts before a predecessor ends. */
export function findConflicts(tasks: readonly GanttTask[]): Conflict[] {
  const index = byId(tasks);
  const found: Conflict[] = [];
  for (const task of tasks) {
    for (const predId of task.after) {
      const pred = index.get(predId);
      if (pred && task.start < end(pred)) found.push({ taskId: task.id, predecessorId: predId, overlap: end(pred) - task.start });
    }
  }
  return found;
}

/** Whether the dependencies contain a loop, which no schedule can satisfy. */
export function hasCycle(tasks: readonly GanttTask[]): boolean {
  const index = byId(tasks);
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string): boolean => {
    const known = state.get(id);
    if (known === 'open') return true;
    if (known === 'done') return false;
    state.set(id, 'open');
    const cyclic = (index.get(id)?.after ?? []).some(visit);
    state.set(id, 'done');
    return cyclic;
  };
  return tasks.some((task) => visit(task.id));
}

/** Pushes successors later wherever a changed task now ends after they start. Returns the ids that moved. */
export function pushSuccessors(tasks: readonly GanttTask[], changed: readonly string[]): { tasks: GanttTask[]; pushed: string[] } {
  const next = tasks.map((task) => ({ ...task }));
  const index = byId(next);
  const pushed = new Set<string>();
  const queue = [...changed];
  let guard = tasks.length * tasks.length + 10;
  while (queue.length > 0 && guard > 0) {
    guard -= 1;
    const id = queue.shift();
    const source = id === undefined ? undefined : index.get(id);
    if (!source) continue;
    for (const task of next) {
      if (!task.after.includes(source.id) || task.start >= end(source)) continue;
      task.start = end(source);
      pushed.add(task.id);
      queue.push(task.id);
    }
  }
  return { tasks: next, pushed: [...pushed] };
}

export type MoveResult = {
  tasks: GanttTask[];
  /** Successors that were pushed later. */
  pushed: string[];
  /** Set when the requested start was earlier than the predecessors allow and was raised. */
  conflict: { taskId: string; predecessorId: string; earliest: number } | null;
};

const latestPredecessor = (tasks: readonly GanttTask[], id: string, ignore?: ReadonlySet<string>): string | null => {
  const index = byId(tasks);
  const task = index.get(id);
  if (!task) return null;
  let best: GanttTask | null = null;
  for (const predId of task.after) {
    const pred = index.get(predId);
    if (pred && !ignore?.has(predId) && (!best || end(pred) > end(best))) best = pred;
  }
  return best?.id ?? null;
};

/** Moves a task (or a whole group) to a new start day. */
export function moveTask(tasks: readonly GanttTask[], id: string, start: number): MoveResult {
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task) return { tasks: [...tasks], pushed: [], conflict: null };
  if (task.kind === 'group') return shiftGroup(tasks, id, start - (rollUp(tasks).get(id)?.start ?? start));

  const earliest = earliestStart(tasks, id);
  const clamped = earliest !== null && start < earliest ? earliest : start;
  const conflict = clamped !== start && earliest !== null ? { taskId: id, predecessorId: latestPredecessor(tasks, id) ?? '', earliest } : null;
  const moved = tasks.map((candidate) => (candidate.id === id ? { ...candidate, start: clamped } : candidate));
  const { tasks: pushedTasks, pushed } = pushSuccessors(moved, [id]);
  return { tasks: pushedTasks, pushed, conflict };
}

/** Moves every leaf of a group by a number of days, stopping short of what its outside predecessors allow. */
export function shiftGroup(tasks: readonly GanttTask[], groupId: string, delta: number): MoveResult {
  const leaves = leavesOf(tasks, groupId);
  const inside = new Set(leaves.map((leaf) => leaf.id));
  let allowed = delta;
  let conflict: MoveResult['conflict'] = null;
  if (delta < 0) {
    for (const leaf of leaves) {
      const earliest = earliestStart(tasks, leaf.id, inside);
      if (earliest !== null && leaf.start + allowed < earliest) {
        allowed = earliest - leaf.start;
        conflict = { taskId: leaf.id, predecessorId: latestPredecessor(tasks, leaf.id, inside) ?? '', earliest };
      }
    }
  }
  if (delta < 0) allowed = Math.min(0, allowed);
  const moved = tasks.map((task) => (inside.has(task.id) ? { ...task, start: task.start + allowed } : task));
  const { tasks: result, pushed } = pushSuccessors(moved, [...inside]);
  return { tasks: result, pushed: pushed.filter((pushedId) => !inside.has(pushedId)), conflict };
}

/** Changes how long a task runs by moving its end, keeping its start. At least one day. */
export function resizeEnd(tasks: readonly GanttTask[], id: string, newEnd: number): MoveResult {
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task || task.kind !== 'task') return { tasks: [...tasks], pushed: [], conflict: null };
  const duration = Math.max(1, newEnd - task.start);
  const resized = tasks.map((candidate) => (candidate.id === id ? { ...candidate, duration } : candidate));
  const { tasks: result, pushed } = pushSuccessors(resized, [id]);
  return { tasks: result, pushed, conflict: null };
}

/** Changes how long a task runs by moving its start, keeping its end. Not earlier than predecessors allow. */
export function resizeStart(tasks: readonly GanttTask[], id: string, newStart: number): MoveResult {
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task || task.kind !== 'task') return { tasks: [...tasks], pushed: [], conflict: null };
  const earliest = earliestStart(tasks, id);
  const lowest = earliest ?? Number.NEGATIVE_INFINITY;
  const start = Math.min(end(task) - 1, Math.max(newStart, lowest));
  const conflict = start > newStart && earliest !== null && newStart < earliest ? { taskId: id, predecessorId: latestPredecessor(tasks, id) ?? '', earliest } : null;
  const resized = tasks.map((candidate) => (candidate.id === id ? { ...candidate, start, duration: end(task) - start } : candidate));
  return { tasks: resized, pushed: [], conflict };
}

export type CriticalPath = {
  /** Ids on the longest chain, with no float. */
  critical: ReadonlySet<string>;
  /** Days each leaf can slip without moving the finish. */
  float: ReadonlyMap<string, number>;
  /** Day the last task ends. */
  finish: number;
};

/**
 * Critical path by the forward and backward pass. A task's current start is the earliest it may
 * begin; predecessors can push it later. A leaf with no float is critical. Groups are never
 * critical themselves; milestones are when the chain runs through them.
 */
export function criticalPath(tasks: readonly GanttTask[]): CriticalPath {
  const leaves = tasks.filter((task) => task.kind !== 'group');
  const index = byId(leaves);
  const successors = new Map<string, string[]>();
  for (const leaf of leaves) for (const pred of leaf.after) if (index.has(pred)) successors.set(pred, [...(successors.get(pred) ?? []), leaf.id]);

  const earlyStart = new Map<string, number>();
  const forward = (id: string, trail: Set<string>): number => {
    const known = earlyStart.get(id);
    if (known !== undefined) return known;
    const task = index.get(id);
    if (!task || trail.has(id)) return task?.start ?? 0;
    trail.add(id);
    const preds = task.after.filter((pred) => index.has(pred));
    const value = Math.max(task.start, ...preds.map((pred) => forward(pred, trail) + (index.get(pred)?.duration ?? 0)));
    trail.delete(id);
    earlyStart.set(id, value);
    return value;
  };
  for (const leaf of leaves) forward(leaf.id, new Set());

  const finish = leaves.length === 0 ? 0 : Math.max(...leaves.map((leaf) => (earlyStart.get(leaf.id) ?? leaf.start) + leaf.duration));
  const lateFinish = new Map<string, number>();
  const backward = (id: string, trail: Set<string>): number => {
    const known = lateFinish.get(id);
    if (known !== undefined) return known;
    if (trail.has(id)) return finish;
    trail.add(id);
    const next = successors.get(id) ?? [];
    const value = next.length === 0 ? finish : Math.min(...next.map((succ) => backward(succ, trail) - (index.get(succ)?.duration ?? 0)));
    trail.delete(id);
    lateFinish.set(id, value);
    return value;
  };

  const float = new Map<string, number>();
  const critical = new Set<string>();
  for (const leaf of leaves) {
    const slack = backward(leaf.id, new Set()) - leaf.duration - (earlyStart.get(leaf.id) ?? leaf.start);
    float.set(leaf.id, slack);
    if (slack === 0) critical.add(leaf.id);
  }
  return { critical, float, finish };
}

export type Row = { task: GanttTask; depth: number; hasChildren: boolean; collapsed: boolean };

/** Tasks in outline order, leaving out everything under a collapsed group. */
export function visibleRows(tasks: readonly GanttTask[], collapsed: ReadonlySet<string>): Row[] {
  const rows: Row[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const task of tasks.filter((candidate) => candidate.parentId === parentId)) {
      const hasChildren = tasks.some((candidate) => candidate.parentId === task.id);
      const isCollapsed = collapsed.has(task.id);
      rows.push({ task, depth, hasChildren, collapsed: isCollapsed });
      if (hasChildren && !isCollapsed) walk(task.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/** First and last day covered by the plan, including baselines. Groups have no dates of their own and are left out. */
export function planSpan(all: readonly GanttTask[]): { start: number; end: number } {
  const tasks = all.filter((task) => task.kind !== 'group');
  if (tasks.length === 0) return { start: 0, end: 0 };
  const starts = tasks.flatMap((task) => [task.start, ...(task.baseline ? [task.baseline.start] : [])]);
  const ends = tasks.flatMap((task) => [end(task), ...(task.baseline ? [task.baseline.start + task.baseline.duration] : [])]);
  return { start: Math.min(...starts), end: Math.max(...ends) };
}
