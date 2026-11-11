import { formatDay } from './ganttScale';
import type { GanttZoom } from './ganttScale';
import { byId, end, moveTask, resizeEnd, resizeStart } from './ganttScheduler';
import type { GanttTask, MoveResult } from './ganttScheduler';

/** State of a Gantt chart: the plan, what is selected and open, and a bounded undo history. */

export type GanttState = {
  tasks: readonly GanttTask[];
  selection: string | null;
  collapsed: readonly string[];
  zoom: GanttZoom;
  critical: boolean;
  baseline: boolean;
  /** The plan as it was when a drag began; drags are always computed from it, so they never drift. */
  edit: readonly GanttTask[] | null;
  past: readonly (readonly GanttTask[])[];
  future: readonly (readonly GanttTask[])[];
  /** The last refused change, in words. */
  conflict: string | null;
  /** Last thing that happened, for the live region. */
  message: string;
};

export type EditMode = 'move' | 'start' | 'end';

export type GanttAction =
  | { type: 'select'; id: string | null }
  | { type: 'toggleCollapse'; id: string }
  | { type: 'setZoom'; zoom: GanttZoom }
  | { type: 'toggleCritical' }
  | { type: 'toggleBaseline' }
  | { type: 'beginEdit' }
  | { type: 'drag'; mode: EditMode; id: string; days: number }
  | { type: 'endEdit' }
  | { type: 'cancelEdit' }
  | { type: 'nudge'; mode: EditMode; id: string; days: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'dismissConflict' };

const HISTORY_LIMIT = 50;

export function initGanttState(tasks: readonly GanttTask[], options: Partial<Pick<GanttState, 'zoom' | 'critical' | 'baseline' | 'collapsed' | 'selection'>> = {}): GanttState {
  return { tasks, selection: null, collapsed: [], zoom: 'day', critical: false, baseline: false, edit: null, past: [], future: [], conflict: null, message: '', ...options };
}

const nameOf = (tasks: readonly GanttTask[], id: string): string => byId(tasks).get(id)?.name ?? id;

function describe(before: readonly GanttTask[], result: MoveResult, id: string, verb: string): { message: string; conflict: string | null } {
  const task = byId(result.tasks).get(id);
  const conflict = result.conflict ? `${nameOf(before, id)} cannot start before ${nameOf(before, result.conflict.predecessorId)} finishes. Earliest start is ${formatDay(result.conflict.earliest)}.` : null;
  const pushed = result.pushed.length > 0 ? ` ${result.pushed.length} later ${result.pushed.length === 1 ? 'task' : 'tasks'} pushed.` : '';
  const when = task ? (task.duration === 0 ? formatDay(task.start) : `${formatDay(task.start)} to ${formatDay(end(task) - 1)}`) : '';
  return { message: conflict ?? `${verb} ${nameOf(before, id)}, ${when}.${pushed}`, conflict };
}

function compute(base: readonly GanttTask[], mode: EditMode, id: string, days: number): MoveResult & { verb: string } {
  const task = byId(base).get(id);
  if (!task) return { tasks: [...base], pushed: [], conflict: null, verb: '' };
  if (mode === 'move') return { ...moveTask(base, id, (base.find((candidate) => candidate.id === id)?.kind === 'group' ? groupStart(base, id) : task.start) + days), verb: 'Moved' };
  if (mode === 'start') return { ...resizeStart(base, id, task.start + days), verb: 'Resized' };
  return { ...resizeEnd(base, id, end(task) + days), verb: 'Resized' };
}

function groupStart(tasks: readonly GanttTask[], id: string): number {
  const stack = [id];
  let first = Infinity;
  while (stack.length > 0) {
    const current = stack.pop();
    for (const task of tasks) {
      if (task.parentId !== current) continue;
      if (task.kind === 'group') stack.push(task.id);
      else first = Math.min(first, task.start);
    }
  }
  return first === Infinity ? 0 : first;
}

const same = (a: readonly GanttTask[], b: readonly GanttTask[]): boolean => a.length === b.length && a.every((task, index) => task.start === b[index].start && task.duration === b[index].duration);

export function ganttReducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'select':
      return { ...state, selection: action.id, message: action.id ? `${nameOf(state.tasks, action.id)} selected` : 'Selection cleared' };
    case 'toggleCollapse': {
      const open = state.collapsed.includes(action.id);
      return { ...state, collapsed: open ? state.collapsed.filter((id) => id !== action.id) : [...state.collapsed, action.id], message: `${nameOf(state.tasks, action.id)} ${open ? 'expanded' : 'collapsed'}` };
    }
    case 'setZoom':
      return { ...state, zoom: action.zoom, message: `Zoom: ${action.zoom === 'day' ? 'days' : action.zoom === 'week' ? 'weeks' : 'months'}` };
    case 'toggleCritical':
      return { ...state, critical: !state.critical, message: state.critical ? 'Critical path hidden' : 'Critical path highlighted' };
    case 'toggleBaseline':
      return { ...state, baseline: !state.baseline, message: state.baseline ? 'Baseline hidden' : 'Baseline shown' };
    case 'beginEdit':
      return { ...state, edit: state.tasks, conflict: null };
    case 'drag': {
      const base = state.edit ?? state.tasks;
      const result = compute(base, action.mode, action.id, action.days);
      const { message, conflict } = describe(base, result, action.id, result.verb);
      return { ...state, tasks: result.tasks, edit: state.edit ?? state.tasks, conflict, message };
    }
    case 'endEdit': {
      if (!state.edit) return state;
      const changed = !same(state.edit, state.tasks);
      return { ...state, edit: null, past: changed ? [...state.past, state.edit].slice(-HISTORY_LIMIT) : state.past, future: changed ? [] : state.future };
    }
    case 'cancelEdit':
      return state.edit ? { ...state, tasks: state.edit, edit: null, conflict: null, message: 'Change cancelled' } : state;
    case 'nudge': {
      const result = compute(state.tasks, action.mode, action.id, action.days);
      const { message, conflict } = describe(state.tasks, result, action.id, result.verb);
      if (same(state.tasks, result.tasks)) return { ...state, conflict, message };
      return { ...state, tasks: result.tasks, past: [...state.past, state.tasks].slice(-HISTORY_LIMIT), future: [], conflict, message };
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return { ...state, tasks: previous, past: state.past.slice(0, -1), future: [state.tasks, ...state.future], conflict: null, message: 'Change undone' };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { ...state, tasks: next, past: [...state.past, state.tasks], future: rest, conflict: null, message: 'Change redone' };
    }
    case 'dismissConflict':
      return state.conflict === null ? state : { ...state, conflict: null };
    default:
      return state;
  }
}
