import { fitPoints, panBy, zoomAbout, zoomCentered } from './mapView';
import type { MapView, ScreenPoint, Size } from './mapView';
import type { LatLong, ProjectionId } from './projection';

export type LayerId = 'sites' | 'pipelines' | 'exports' | 'blocks';

export type MapLayers = Readonly<Record<LayerId, boolean>>;

export type MapState = {
  projection: ProjectionId;
  view: MapView;
  size: Size;
  layers: MapLayers;
  selectedId: string | null;
  /** The view before the last gesture, newest last, for the Back button. */
  past: readonly MapView[];
  /** The view the map was given, for Reset. */
  home: MapView;
  drag: { origin: ScreenPoint; start: MapView; moved: boolean } | null;
};

export type MapAction =
  | { type: 'resize'; size: Size }
  | { type: 'drag-start'; point: ScreenPoint }
  | { type: 'drag-move'; point: ScreenPoint }
  | { type: 'drag-end' }
  | { type: 'zoom-at'; point: ScreenPoint; factor: number }
  | { type: 'zoom-step'; factor: number }
  | { type: 'pan-key'; dx: number; dy: number }
  | { type: 'fit'; points: readonly LatLong[] }
  | { type: 'set-view'; view: MapView }
  | { type: 'projection'; projection: ProjectionId }
  | { type: 'toggle-layer'; layer: LayerId }
  | { type: 'select'; id: string | null }
  | { type: 'back' }
  | { type: 'home' };

export const HISTORY_DEPTH = 20;
/** Pixels the pointer may move before a press counts as a drag rather than a click. */
export const DRAG_THRESHOLD = 4;

export function createMapState(view: MapView, size: Size, options: { projection?: ProjectionId; layers?: Partial<MapLayers>; selectedId?: string | null } = {}): MapState {
  return {
    projection: options.projection ?? 'mercator',
    view,
    size,
    layers: { sites: true, pipelines: true, exports: true, blocks: false, ...options.layers },
    selectedId: options.selectedId ?? null,
    past: [],
    home: view,
    drag: null,
  };
}

const remember = (state: MapState): readonly MapView[] => [...state.past, state.view].slice(-HISTORY_DEPTH);

/**
 * State of an interactive map: the view, the projection, layers, the selected site and a short
 * history of views. A drag is pure arithmetic on the view it started from, so it never drifts,
 * and a press that barely moves stays a click.
 */
export function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'resize':
      return action.size.width === state.size.width && action.size.height === state.size.height ? state : { ...state, size: action.size };
    case 'drag-start':
      return { ...state, drag: { origin: action.point, start: state.view, moved: false } };
    case 'drag-move': {
      if (!state.drag) return state;
      const dx = action.point.x - state.drag.origin.x;
      const dy = action.point.y - state.drag.origin.y;
      const moved = state.drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD;
      if (!moved) return state;
      return { ...state, view: panBy(state.projection, state.drag.start, dx, dy), drag: { ...state.drag, moved: true } };
    }
    case 'drag-end':
      if (!state.drag) return state;
      return { ...state, drag: null, past: state.drag.moved ? [...state.past, state.drag.start].slice(-HISTORY_DEPTH) : state.past };
    case 'zoom-at': {
      // The wheel fires in bursts, so it changes the view without adding history steps.
      const view = zoomAbout(state.projection, state.view, state.size, action.point, action.factor);
      return view === state.view ? state : { ...state, view };
    }
    case 'zoom-step': {
      const view = zoomCentered(state.projection, state.view, state.size, action.factor);
      return view === state.view ? state : { ...state, view, past: remember(state) };
    }
    case 'pan-key':
      return { ...state, view: panBy(state.projection, state.view, -action.dx, -action.dy), past: remember(state) };
    case 'fit': {
      if (action.points.length === 0) return state;
      return { ...state, view: fitPoints(state.projection, state.size, action.points), past: remember(state) };
    }
    case 'set-view':
      return { ...state, view: action.view, past: remember(state) };
    case 'projection':
      return action.projection === state.projection ? state : { ...state, projection: action.projection, past: remember(state) };
    case 'toggle-layer':
      return { ...state, layers: { ...state.layers, [action.layer]: !state.layers[action.layer] } };
    case 'select':
      return { ...state, selectedId: action.id };
    case 'back': {
      const previous = state.past[state.past.length - 1];
      return previous ? { ...state, view: previous, past: state.past.slice(0, -1) } : state;
    }
    case 'home':
      return { ...state, view: state.home, past: remember(state) };
  }
}
