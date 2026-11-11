import type { LinkSide } from './tagMapping';

/**
 * Selection state of a linked split view, keyed by functional location tag so neither half needs
 * to know the other's ids. Each half keeps its own selection; with `sync` on they move together.
 */
export type LinkedSelectionState = {
  /** Selecting on one side selects on the other. */
  sync: boolean;
  /** The 3D camera flies to whatever becomes selected in the scene. */
  follow: boolean;
  /** Ghost everything in the scene that the drawing does not show. */
  drawingOnly: boolean;
  /** Selected tag per side. */
  selected: Record<LinkSide, string | null>;
  /** Tag under the pointer and the side the pointer is on. */
  hover: { tag: string; side: LinkSide } | null;
  /** Tag the 3D camera frames; `null` frames the whole area. */
  focusTag: string | null;
  /** The side the last selection came from, for the status line. */
  origin: LinkSide | null;
};

export type LinkedSelectionAction =
  | { type: 'select'; side: LinkSide; tag: string | null }
  | { type: 'hover'; side: LinkSide; tag: string | null }
  | { type: 'setSync'; value: boolean }
  | { type: 'setFollow'; value: boolean }
  | { type: 'setDrawingOnly'; value: boolean }
  | { type: 'clear' };

export const INITIAL_LINKED_SELECTION: LinkedSelectionState = {
  sync: true,
  follow: true,
  drawingOnly: false,
  selected: { drawing: null, scene: null },
  hover: null,
  focusTag: null,
  origin: null,
};

const other = (side: LinkSide): LinkSide => (side === 'drawing' ? 'scene' : 'drawing');

/**
 * Reducer for a linked split view. Selecting the selected tag again clears it. With sync on a
 * selection lands on both sides; with follow on the camera target tracks the scene's selection.
 * Turning sync on copies the most recent selection across; turning follow on frames it.
 */
export function linkedSelectionReducer(state: LinkedSelectionState, action: LinkedSelectionAction): LinkedSelectionState {
  switch (action.type) {
    case 'select': {
      const tag = action.tag !== null && state.selected[action.side] === action.tag ? null : action.tag;
      const selected = state.sync ? { drawing: tag, scene: tag } : { ...state.selected, [action.side]: tag };
      const reachesScene = action.side === 'scene' || state.sync;
      return { ...state, selected, origin: tag === null ? null : action.side, focusTag: state.follow && reachesScene ? tag : state.focusTag };
    }
    case 'hover':
      if (action.tag === null) return state.hover?.side === action.side ? { ...state, hover: null } : state;
      return { ...state, hover: { tag: action.tag, side: action.side } };
    case 'setSync': {
      if (!action.value) return { ...state, sync: false };
      const lead = state.origin ?? 'drawing';
      const tag = state.selected[lead] ?? state.selected[other(lead)];
      return { ...state, sync: true, selected: { drawing: tag, scene: tag }, focusTag: state.follow ? tag : state.focusTag };
    }
    case 'setFollow':
      return { ...state, follow: action.value, focusTag: action.value ? state.selected.scene : state.focusTag };
    case 'setDrawingOnly':
      return { ...state, drawingOnly: action.value };
    case 'clear':
      return { ...state, selected: { drawing: null, scene: null }, hover: null, origin: null, focusTag: state.follow ? null : state.focusTag };
  }
}

/** The tag to highlight as hovered on a side: its own hover always, the other side's only while synced. */
export function hoverTagOn(state: LinkedSelectionState, side: LinkSide): string | null {
  if (!state.hover) return null;
  return state.hover.side === side || state.sync ? state.hover.tag : null;
}

/** The tag the shared selection bar describes: the side that was used last, else whichever has one. */
export function primaryTag(state: LinkedSelectionState): string | null {
  const lead = state.origin ?? 'drawing';
  return state.selected[lead] ?? state.selected[other(lead)];
}
