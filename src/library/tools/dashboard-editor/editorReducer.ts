import { addItem, compact, describePlacement, moveItem, nudgeItem, removeItem, resizeItem, sameLayout } from './gridLayout';
import type { GridItem } from './gridLayout';

/** A widget on the dashboard: its place on the grid plus what it shows. */
export type EditorWidget = GridItem & {
  /** Key of the widget type that renders it. */
  type: string;
  title: string;
  /** Time range the widget covers, e.g. "24h". */
  range: string;
};

export type EditorMode = 'edit' | 'view';
export type DragKind = 'move' | 'resize';

export type EditorDrag = {
  id: string;
  kind: DragKind;
  /** The layout when the drag began; restored on cancel and pushed to history on drop. */
  origin: readonly EditorWidget[];
};

export type EditorState = {
  widgets: readonly EditorWidget[];
  /** The layout as last saved. */
  saved: readonly EditorWidget[];
  past: readonly (readonly EditorWidget[])[];
  future: readonly (readonly EditorWidget[])[];
  /** Committed edits since the last save; undo takes one away. */
  changes: number;
  selectedId: string | null;
  mode: EditorMode;
  drag: EditorDrag | null;
  /** The latest result in words, for an `aria-live` region. */
  announcement: string;
  nextId: number;
  cols: number;
};

export type NewWidget = Omit<EditorWidget, 'id' | 'x' | 'y'>;

export type EditorAction =
  | { type: 'setMode'; mode: EditorMode }
  | { type: 'select'; id: string | null }
  | { type: 'add'; widget: NewWidget }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'nudge'; id: string; dx: number; dy: number }
  | { type: 'grow'; id: string; dw: number; dh: number }
  | { type: 'configure'; id: string; patch: Partial<Pick<EditorWidget, 'title' | 'range' | 'w' | 'h'>> }
  | { type: 'dragStart'; id: string; kind: DragKind }
  | { type: 'dragMove'; x: number; y: number }
  | { type: 'dragResize'; w: number; h: number }
  | { type: 'dragNudge'; dx: number; dy: number }
  | { type: 'dragEnd' }
  | { type: 'dragCancel' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'replace'; widgets: readonly EditorWidget[]; label: string }
  | { type: 'save' }
  | { type: 'discard' };

/** How many steps of undo are kept. */
export const HISTORY_LIMIT = 50;

type CreateOptions = { widgets: readonly EditorWidget[]; cols?: number; mode?: EditorMode };

export function createEditorState({ widgets, cols = 12, mode = 'edit' }: CreateOptions): EditorState {
  const layout = compact(widgets, cols);
  return {
    widgets: layout,
    saved: layout,
    past: [],
    future: [],
    changes: 0,
    selectedId: null,
    mode,
    drag: null,
    announcement: '',
    nextId: widgets.length + 1,
    cols,
  };
}

const sameWidgets = (a: readonly EditorWidget[], b: readonly EditorWidget[]): boolean =>
  sameLayout(a, b) &&
  a.every((widget) => {
    const other = b.find((entry) => entry.id === widget.id);
    return other !== undefined && other.title === widget.title && other.range === widget.range && other.type === widget.type;
  });

function commit(state: EditorState, widgets: readonly EditorWidget[], announcement: string, before: readonly EditorWidget[] = state.widgets): EditorState {
  if (sameWidgets(widgets, before)) return { ...state, widgets, announcement };
  return {
    ...state,
    widgets,
    past: [...state.past, before].slice(-HISTORY_LIMIT),
    future: [],
    changes: state.changes + 1,
    announcement,
  };
}

const find = (state: EditorState, id: string): EditorWidget | undefined => state.widgets.find((widget) => widget.id === id);

function placed(widgets: readonly EditorWidget[], id: string): string {
  const widget = widgets.find((entry) => entry.id === id);
  return widget ? describePlacement(widget) : '';
}

/** True while the dashboard differs from what was last saved. */
export const isDirty = (state: EditorState): boolean => !sameWidgets(state.widgets, state.saved);

/** The widget being dragged, at its preview position. */
export function draggedWidget(state: EditorState): EditorWidget | undefined {
  return state.drag ? find(state, state.drag.id) : undefined;
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'setMode') {
    if (action.mode === state.mode) return state;
    const settled = state.drag ? { ...state, widgets: state.drag.origin, drag: null } : state;
    return {
      ...settled,
      mode: action.mode,
      selectedId: action.mode === 'view' ? null : settled.selectedId,
      announcement: action.mode === 'edit' ? 'Editing dashboard.' : 'Viewing dashboard.',
    };
  }
  if (action.type === 'select') return state.mode === 'edit' ? { ...state, selectedId: action.id } : state;
  if (state.mode === 'view') return state;

  const { cols } = state;

  switch (action.type) {
    case 'add': {
      const id = `w${state.nextId}`;
      const widgets = addItem(state.widgets, { ...action.widget, id, x: 0, y: 0 }, cols);
      return { ...commit(state, widgets, `Added ${action.widget.title} at ${placed(widgets, id)}.`), nextId: state.nextId + 1, selectedId: id };
    }
    case 'remove': {
      const widget = find(state, action.id);
      if (!widget) return state;
      const next = commit(state, removeItem(state.widgets, action.id, cols), `Removed ${widget.title}.`);
      return { ...next, selectedId: next.selectedId === action.id ? null : next.selectedId };
    }
    case 'duplicate': {
      const widget = find(state, action.id);
      if (!widget) return state;
      const id = `w${state.nextId}`;
      const title = `${widget.title} copy`;
      const widgets = addItem(state.widgets, { ...widget, id, title }, cols);
      return { ...commit(state, widgets, `Duplicated ${widget.title}. The copy is at ${placed(widgets, id)}.`), nextId: state.nextId + 1, selectedId: id };
    }
    case 'nudge': {
      const widget = find(state, action.id);
      if (!widget) return state;
      const widgets = nudgeItem(state.widgets, action.id, action.dx, action.dy, cols);
      if (sameLayout(widgets, state.widgets)) return { ...state, announcement: `${widget.title} cannot move further that way.` };
      return commit(state, widgets, `Moved ${widget.title} to ${placed(widgets, action.id)}.`);
    }
    case 'grow': {
      const widget = find(state, action.id);
      if (!widget) return state;
      const widgets = resizeItem(state.widgets, action.id, widget.w + action.dw, widget.h + action.dh, cols);
      if (sameLayout(widgets, state.widgets)) return { ...state, announcement: `${widget.title} cannot be resized further that way.` };
      return commit(state, widgets, `Resized ${widget.title} to ${placed(widgets, action.id)}.`);
    }
    case 'configure': {
      const widget = find(state, action.id);
      if (!widget) return state;
      const { w = widget.w, h = widget.h, title = widget.title, range = widget.range } = action.patch;
      const renamed = state.widgets.map((entry) => (entry.id === action.id ? { ...entry, title, range } : entry));
      const widgets = w === widget.w && h === widget.h ? renamed : resizeItem(renamed, action.id, w, h, cols);
      return commit(state, widgets, `Updated ${title}.`);
    }
    case 'dragStart': {
      const widget = find(state, action.id);
      if (!widget || state.drag) return state;
      const verb = action.kind === 'move' ? 'Picked up' : 'Resizing';
      return {
        ...state,
        drag: { id: action.id, kind: action.kind, origin: state.widgets },
        selectedId: action.id,
        announcement: `${verb} ${widget.title}. Use the arrow keys, Enter to drop, Escape to cancel.`,
      };
    }
    case 'dragMove': {
      if (state.drag?.kind !== 'move') return state;
      const widgets = moveItem(state.drag.origin, state.drag.id, action.x, action.y, cols);
      return sameLayout(widgets, state.widgets) ? state : { ...state, widgets };
    }
    case 'dragResize': {
      if (state.drag?.kind !== 'resize') return state;
      const widgets = resizeItem(state.drag.origin, state.drag.id, action.w, action.h, cols);
      return sameLayout(widgets, state.widgets) ? state : { ...state, widgets };
    }
    case 'dragNudge': {
      if (!state.drag) return state;
      const widget = find(state, state.drag.id);
      if (!widget) return state;
      const widgets =
        state.drag.kind === 'move'
          ? nudgeItem(state.widgets, widget.id, action.dx, action.dy, cols)
          : resizeItem(state.widgets, widget.id, widget.w + action.dx, widget.h + action.dy, cols);
      if (sameLayout(widgets, state.widgets)) return { ...state, announcement: `${widget.title} cannot go further that way.` };
      return { ...state, widgets, announcement: `${widget.title} at ${placed(widgets, widget.id)}.` };
    }
    case 'dragEnd': {
      if (!state.drag) return state;
      const { id, kind, origin } = state.drag;
      const widget = find(state, id);
      const verb = kind === 'move' ? 'Dropped' : 'Resized';
      const announcement = sameLayout(state.widgets, origin)
        ? `${widget?.title ?? 'Widget'} stays where it was.`
        : `${verb} ${widget?.title ?? 'widget'} at ${placed(state.widgets, id)}.`;
      return { ...commit({ ...state, drag: null }, state.widgets, announcement, origin), drag: null };
    }
    case 'dragCancel': {
      if (!state.drag) return state;
      const widget = find(state, state.drag.id);
      return { ...state, widgets: state.drag.origin, drag: null, announcement: `Cancelled. ${widget?.title ?? 'Widget'} is back where it was.` };
    }
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous || state.drag) return state;
      return {
        ...state,
        widgets: previous,
        past: state.past.slice(0, -1),
        future: [state.widgets, ...state.future],
        changes: state.changes - 1,
        selectedId: previous.some((widget) => widget.id === state.selectedId) ? state.selectedId : null,
        announcement: 'Undid the last change.',
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next || state.drag) return state;
      return {
        ...state,
        widgets: next,
        past: [...state.past, state.widgets],
        future: rest,
        changes: state.changes + 1,
        selectedId: next.some((widget) => widget.id === state.selectedId) ? state.selectedId : null,
        announcement: 'Redid the change.',
      };
    }
    case 'replace': {
      const widgets = compact(action.widgets, cols);
      const next = commit(state, widgets, `Applied ${action.label}.`);
      return { ...next, drag: null, selectedId: null };
    }
    case 'save':
      return { ...state, saved: state.widgets, changes: 0, announcement: 'Dashboard saved.' };
    case 'discard':
      return { ...state, widgets: state.saved, past: [], future: [], changes: 0, drag: null, selectedId: null, announcement: 'Changes discarded.' };
    default:
      return state;
  }
}
