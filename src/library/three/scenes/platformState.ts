import { clampUnit } from './explode';

/**
 * State of an exploded-view explorer: how far the levels are separated, which level is isolated
 * (the others ghost) and which piece of equipment on it is selected. Plain JSON, one reducer.
 */
export type PlatformState = {
  /** 0 (assembled) to 1 (fully exploded). */
  explode: number;
  levelId: string | null;
  equipmentId: string | null;
};

export type PlatformAction =
  | { type: 'setExplode'; amount: number }
  /** Fully explode when mostly assembled, assemble when mostly exploded. */
  | { type: 'toggleExplode' }
  /** Isolate a level; isolating the isolated level again shows the whole platform. */
  | { type: 'isolate'; levelId: string }
  /** Select equipment; its level becomes the isolated one. */
  | { type: 'selectEquipment'; levelId: string; equipmentId: string }
  | { type: 'clearEquipment' }
  /** One step back: equipment, then level, then explode. */
  | { type: 'up' }
  | { type: 'reset' };

export const INITIAL_PLATFORM_STATE: PlatformState = { explode: 0, levelId: null, equipmentId: null };

/** Whether the stack counts as exploded, for the label of the toggle. */
export function isExploded(state: PlatformState): boolean {
  return state.explode > 0.5;
}

export type PlatformDepth = 'platform' | 'level' | 'equipment';

export function platformDepth(state: PlatformState): PlatformDepth {
  if (state.equipmentId) return 'equipment';
  if (state.levelId) return 'level';
  return 'platform';
}

/** How a level should be drawn: `solid` normally, `ghost` when another level is isolated. */
export function levelVisibility(state: PlatformState, levelId: string): 'solid' | 'ghost' {
  return state.levelId !== null && state.levelId !== levelId ? 'ghost' : 'solid';
}

export function platformReducer(state: PlatformState, action: PlatformAction): PlatformState {
  switch (action.type) {
    case 'setExplode': {
      const explode = clampUnit(action.amount);
      return explode === state.explode ? state : { ...state, explode };
    }
    case 'toggleExplode':
      return { ...state, explode: isExploded(state) ? 0 : 1 };
    case 'isolate':
      if (state.levelId === action.levelId) return { ...state, levelId: null, equipmentId: null };
      return { ...state, levelId: action.levelId, equipmentId: null };
    case 'selectEquipment':
      if (state.levelId === action.levelId && state.equipmentId === action.equipmentId) return { ...state, equipmentId: null };
      return { ...state, levelId: action.levelId, equipmentId: action.equipmentId };
    case 'clearEquipment':
      return state.equipmentId ? { ...state, equipmentId: null } : state;
    case 'up':
      if (state.equipmentId) return { ...state, equipmentId: null };
      if (state.levelId) return { ...state, levelId: null };
      if (state.explode > 0) return { ...state, explode: 0 };
      return state;
    case 'reset':
      return INITIAL_PLATFORM_STATE;
  }
}
