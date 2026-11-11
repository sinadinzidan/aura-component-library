import type { SchedEvent } from './conflicts';
import type { Placement } from './geometry';
import { formatSpan, longDayLabel } from './timeMath';

/** The values of an item that is being created, before it exists. */
export type Draft = Pick<SchedEvent, 'dayId' | 'resourceId' | 'start' | 'end'>;

export type SchedulerState = {
  events: readonly SchedEvent[];
  /** The item with focus or in the detail panel. */
  selectedId: string | null;
  /** Whether the detail panel is open for the selected item. */
  detailOpen: boolean;
  /** The time range picked by a drag, waiting for the quick-create form. */
  draft: Draft | null;
  past: readonly (readonly SchedEvent[])[];
  future: readonly (readonly SchedEvent[])[];
  nextId: number;
  /** What just happened, for an `aria-live` region. */
  announcement: string;
};

export type SchedulerAction =
  | { type: 'select'; id: string | null }
  | { type: 'open'; id: string }
  | { type: 'closeDetail' }
  | { type: 'setDraft'; draft: Draft | null }
  | { type: 'create'; event: Omit<SchedEvent, 'id'> }
  | { type: 'place'; id: string; placement: Placement }
  | { type: 'rename'; id: string; title: string }
  | { type: 'remove'; id: string }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 50;

export function createSchedulerState(events: readonly SchedEvent[]): SchedulerState {
  return { events, selectedId: null, detailOpen: false, draft: null, past: [], future: [], nextId: 1, announcement: '' };
}

function commit(state: SchedulerState, events: readonly SchedEvent[], announcement: string): SchedulerState {
  return { ...state, events, past: [...state.past, state.events].slice(-HISTORY_LIMIT), future: [], announcement };
}

/** "Inspect drive-end bearing, Thursday 12 March, 08:00–12:00". */
export function describeEvent(event: SchedEvent, crews: Readonly<Record<string, string>> = {}): string {
  const when = event.allDay ? 'all day' : formatSpan(event.start, event.end);
  const crew = crews[event.resourceId];
  return `${event.title}, ${longDayLabel(event.dayId)}, ${when}${crew ? `, ${crew}` : ''}`;
}

export function schedulerReducer(state: SchedulerState, action: SchedulerAction): SchedulerState {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id, detailOpen: action.id === null ? false : state.detailOpen };
    case 'open':
      return state.events.some((event) => event.id === action.id) ? { ...state, selectedId: action.id, detailOpen: true, draft: null } : state;
    case 'closeDetail':
      return { ...state, detailOpen: false };
    case 'setDraft':
      return { ...state, draft: action.draft, detailOpen: action.draft ? false : state.detailOpen };
    case 'create': {
      const id = `new-${state.nextId}`;
      const event: SchedEvent = { ...action.event, id, title: action.event.title.trim() === '' ? 'Untitled job' : action.event.title.trim() };
      const next = commit(state, [...state.events, event], `Created ${describeEvent(event)}`);
      return { ...next, nextId: state.nextId + 1, selectedId: id, draft: null };
    }
    case 'place': {
      const current = state.events.find((event) => event.id === action.id);
      if (!current || current.allDay) return state;
      const { dayId, resourceId, start, end } = action.placement;
      if (current.dayId === dayId && current.resourceId === resourceId && current.start === start && current.end === end) return state;
      const moved = { ...current, dayId, resourceId, start, end };
      return commit(state, state.events.map((event) => (event.id === action.id ? moved : event)), `Moved ${describeEvent(moved)}`);
    }
    case 'rename': {
      const title = action.title.trim();
      const current = state.events.find((event) => event.id === action.id);
      if (!current || title === '' || title === current.title) return state;
      return commit(state, state.events.map((event) => (event.id === action.id ? { ...event, title } : event)), `Renamed to ${title}`);
    }
    case 'remove': {
      const current = state.events.find((event) => event.id === action.id);
      if (!current) return state;
      const next = commit(state, state.events.filter((event) => event.id !== action.id), `Deleted ${current.title}`);
      return { ...next, selectedId: state.selectedId === action.id ? null : state.selectedId, detailOpen: state.selectedId === action.id ? false : state.detailOpen };
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return { ...state, announcement: 'Nothing to undo' };
      const selectedId = state.selectedId !== null && previous.some((event) => event.id === state.selectedId) ? state.selectedId : null;
      return { ...state, events: previous, past: state.past.slice(0, -1), future: [state.events, ...state.future], selectedId, detailOpen: selectedId === null ? false : state.detailOpen, announcement: 'Undid last change' };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return { ...state, announcement: 'Nothing to redo' };
      const selectedId = state.selectedId !== null && next.some((event) => event.id === state.selectedId) ? state.selectedId : null;
      return { ...state, events: next, past: [...state.past, state.events], future: state.future.slice(1), selectedId, detailOpen: selectedId === null ? false : state.detailOpen, announcement: 'Redid change' };
    }
    default:
      return state;
  }
}
