import type { PlanRect } from '../../experiences/drilldown/planLayout';

import { ALL_LAYERS_ON, PID_LAYERS } from './pidModel';
import type { PidLayer, PidLayers, PidPin } from './pidModel';
import { DEFAULT_ZOOM_LIMITS, ZOOM_STEP, centreOn, clampScale, constrainViewport, fitRect, panBy, zoomAbout, zoomPercent, zoomTo } from './viewport';
import type { ViewPoint, ViewSize, Viewport, ZoomLimits } from './viewport';

/** State of a P&ID viewer: where the user is looking, what is selected, shown and pinned. */

export type PidSelection = { kind: 'tag' | 'line' | 'pin'; id: string } | null;

export type PidState = {
  world: PlanRect;
  size: ViewSize;
  limits: ZoomLimits;
  viewport: Viewport;
  /** True until the user pans or zooms; while true a resize refits the drawing. */
  autoFit: boolean;
  selection: PidSelection;
  layers: PidLayers;
  pins: readonly PidPin[];
  /** Earlier pin lists, newest last, for undo. */
  pinPast: readonly (readonly PidPin[])[];
  pinMode: boolean;
  nextPinNumber: number;
  /** Last thing that happened, for the live region. */
  message: string;
};

export type PidAction =
  | { type: 'resize'; size: ViewSize }
  | { type: 'setViewport'; viewport: Viewport; announce?: string }
  | { type: 'lookAt'; centre: ViewPoint; k?: number; announce?: string }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'zoom'; direction: 1 | -1; anchor?: ViewPoint }
  | { type: 'zoomBy'; factor: number; anchor: ViewPoint }
  | { type: 'zoomTo'; percent: number }
  | { type: 'fit' }
  | { type: 'select'; selection: PidSelection; announce?: string }
  | { type: 'toggleLayer'; layer: PidLayer }
  | { type: 'setLayers'; layers: PidLayers }
  | { type: 'setPinMode'; on: boolean }
  | { type: 'addPin'; x: number; y: number }
  | { type: 'editPin'; id: string; note: string }
  | { type: 'removePin'; id: string }
  | { type: 'undoPins' };

export type PidInit = {
  world: PlanRect;
  size?: ViewSize;
  limits?: ZoomLimits;
  layers?: Partial<PidLayers>;
  pins?: readonly PidPin[];
  selection?: PidSelection;
  padding?: number;
};

/** Screen pixels left around the drawing when it is fitted. */
export const FIT_PADDING = 16;
/** Screen pixels one arrow-key press pans. */
export const KEY_PAN = 48;
const HISTORY_LIMIT = 30;

export const DEFAULT_SIZE: ViewSize = { width: 960, height: 540 };

export function initPidState({ world, size = DEFAULT_SIZE, limits = DEFAULT_ZOOM_LIMITS, layers, pins = [], selection = null }: PidInit): PidState {
  return {
    world,
    size,
    limits,
    viewport: fitRect(world, size, FIT_PADDING, limits),
    autoFit: true,
    selection,
    layers: { ...ALL_LAYERS_ON, ...layers },
    pins,
    pinPast: [],
    pinMode: false,
    nextPinNumber: pins.length + 1,
    message: '',
  };
}

const centre = (size: ViewSize): ViewPoint => ({ x: size.width / 2, y: size.height / 2 });

function moved(state: PidState, viewport: Viewport, message: string): PidState {
  const constrained = constrainViewport(viewport, state.size, state.world);
  if (constrained === state.viewport) return state;
  return { ...state, viewport: constrained, autoFit: false, message };
}

function withPins(state: PidState, pins: readonly PidPin[], message: string): PidState {
  return { ...state, pins, pinPast: [...state.pinPast, state.pins].slice(-HISTORY_LIMIT), message };
}

const layerLabel = (layer: PidLayer): string => PID_LAYERS.find((entry) => entry.id === layer)?.label ?? layer;

export function pidReducer(state: PidState, action: PidAction): PidState {
  switch (action.type) {
    case 'resize': {
      if (action.size.width === state.size.width && action.size.height === state.size.height) return state;
      if (state.autoFit) return { ...state, size: action.size, viewport: fitRect(state.world, action.size, FIT_PADDING, state.limits) };
      // Keep the same world point in the middle of the canvas.
      const dx = (action.size.width - state.size.width) / 2;
      const dy = (action.size.height - state.size.height) / 2;
      return { ...state, size: action.size, viewport: panBy(state.viewport, dx, dy) };
    }
    case 'setViewport':
      return { ...state, viewport: action.viewport, autoFit: false, message: action.announce ?? state.message };
    case 'lookAt': {
      // Stated as a centre, not a corner, so it stays right when the canvas changes size mid-flight.
      const k = clampScale(action.k ?? state.viewport.k, state.limits);
      return { ...state, viewport: constrainViewport(centreOn(action.centre, state.size, k), state.size, state.world), autoFit: false, message: action.announce ?? state.message };
    }
    case 'pan':
      return moved(state, panBy(state.viewport, action.dx, action.dy), state.message);
    case 'zoom': {
      const factor = action.direction === 1 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const next = zoomAbout(state.viewport, action.anchor ?? centre(state.size), factor, state.limits);
      return moved(state, next, `Zoom ${zoomPercent(next)}%`);
    }
    case 'zoomBy': {
      const next = zoomAbout(state.viewport, action.anchor, action.factor, state.limits);
      return moved(state, next, `Zoom ${zoomPercent(next)}%`);
    }
    case 'zoomTo': {
      const next = zoomTo(state.viewport, centre(state.size), action.percent / 100, state.limits);
      return moved(state, next, `Zoom ${zoomPercent(next)}%`);
    }
    case 'fit':
      return { ...state, viewport: fitRect(state.world, state.size, FIT_PADDING, state.limits), autoFit: true, message: 'Drawing fitted to view' };
    case 'select':
      return { ...state, selection: action.selection, autoFit: action.selection ? false : state.autoFit, message: action.announce ?? (action.selection ? state.message : 'Selection cleared') };
    case 'toggleLayer': {
      const on = !state.layers[action.layer];
      return { ...state, layers: { ...state.layers, [action.layer]: on }, message: `${layerLabel(action.layer)} ${on ? 'shown' : 'hidden'}` };
    }
    case 'setLayers':
      return { ...state, layers: action.layers };
    case 'setPinMode':
      return { ...state, pinMode: action.on, message: action.on ? 'Pin mode on. Click the drawing or press Enter to place a pin.' : 'Pin mode off' };
    case 'addPin': {
      const id = `pin-${state.nextPinNumber}`;
      const pin: PidPin = { id, x: Math.round(action.x), y: Math.round(action.y), note: '' };
      return {
        ...withPins(state, [...state.pins, pin], `Pin ${state.nextPinNumber} added`),
        nextPinNumber: state.nextPinNumber + 1,
        pinMode: false,
        selection: { kind: 'pin', id },
        layers: { ...state.layers, annotations: true },
      };
    }
    case 'editPin':
      // Typing is not worth an undo step each keystroke; the note is edited in place.
      return { ...state, pins: state.pins.map((pin) => (pin.id === action.id ? { ...pin, note: action.note } : pin)) };
    case 'removePin': {
      if (!state.pins.some((pin) => pin.id === action.id)) return state;
      const next = withPins(
        state,
        state.pins.filter((pin) => pin.id !== action.id),
        'Pin removed'
      );
      return state.selection?.kind === 'pin' && state.selection.id === action.id ? { ...next, selection: null } : next;
    }
    case 'undoPins': {
      const previous = state.pinPast[state.pinPast.length - 1];
      if (!previous) return state;
      const stillThere = state.selection?.kind !== 'pin' || previous.some((pin) => pin.id === state.selection?.id);
      return { ...state, pins: previous, pinPast: state.pinPast.slice(0, -1), selection: stillThere ? state.selection : null, message: 'Pin change undone' };
    }
    default:
      return state;
  }
}

/** Label of a pin: its number, from its id. */
export const pinNumber = (pin: Pick<PidPin, 'id'>): string => pin.id.replace(/^pin-/, '');
