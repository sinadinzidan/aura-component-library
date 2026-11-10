/**
 * Drill-down state for a plant explorer: Plant → Area → Equipment → Sensor. One reducer owns it,
 * and breadcrumb, camera focus and panels are all derived from it. The state is plain JSON, so it
 * can be synced to a URL or host state unchanged.
 */
export type ExplorerState = {
  areaId: string | null;
  equipmentId: string | null;
  sensorId: string | null;
};

export type ExplorerLevel = 'plant' | 'area' | 'equipment' | 'sensor';

export type ExplorerAction =
  | { type: 'selectArea'; areaId: string }
  | { type: 'selectEquipment'; areaId: string; equipmentId: string }
  | { type: 'selectSensor'; sensorId: string }
  /** One level up. Does nothing at plant level. */
  | { type: 'up' }
  /** Back to the whole plant. */
  | { type: 'home' };

export const INITIAL_EXPLORER_STATE: ExplorerState = { areaId: null, equipmentId: null, sensorId: null };

export function explorerLevel(state: ExplorerState): ExplorerLevel {
  if (state.sensorId) return 'sensor';
  if (state.equipmentId) return 'equipment';
  if (state.areaId) return 'area';
  return 'plant';
}

export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'selectArea':
      return { areaId: action.areaId, equipmentId: null, sensorId: null };
    case 'selectEquipment':
      return { areaId: action.areaId, equipmentId: action.equipmentId, sensorId: null };
    case 'selectSensor':
      // A sensor only exists on a piece of equipment; ignore it anywhere else.
      return state.equipmentId ? { ...state, sensorId: action.sensorId } : state;
    case 'up':
      if (state.sensorId) return { ...state, sensorId: null };
      if (state.equipmentId) return { ...state, equipmentId: null };
      if (state.areaId) return INITIAL_EXPLORER_STATE;
      return state;
    case 'home':
      return INITIAL_EXPLORER_STATE;
  }
}

/** The scene node the camera should frame: the deepest selected area or equipment, else the plant. */
export function explorerFocusId(state: ExplorerState, plantId: string): string {
  return state.equipmentId ?? state.areaId ?? plantId;
}

export type ExplorerCrumb = {
  id: string;
  label: string;
  level: ExplorerLevel;
  /** The action that returns to this crumb; `null` for the current (last) one. */
  action: ExplorerAction | null;
};

/**
 * The breadcrumb for a state, from the plant down to the current level. `labelOf` turns an id into
 * its display name, so the reducer stays free of plant data.
 */
export function explorerBreadcrumb(state: ExplorerState, plantId: string, labelOf: (id: string, level: ExplorerLevel) => string): ExplorerCrumb[] {
  const steps: { id: string; level: ExplorerLevel; action: ExplorerAction }[] = [{ id: plantId, level: 'plant', action: { type: 'home' } }];
  if (state.areaId) steps.push({ id: state.areaId, level: 'area', action: { type: 'selectArea', areaId: state.areaId } });
  if (state.areaId && state.equipmentId) {
    steps.push({ id: state.equipmentId, level: 'equipment', action: { type: 'selectEquipment', areaId: state.areaId, equipmentId: state.equipmentId } });
  }
  if (state.equipmentId && state.sensorId) {
    steps.push({ id: state.sensorId, level: 'sensor', action: { type: 'selectSensor', sensorId: state.sensorId } });
  }
  return steps.map((step, index) => ({
    id: step.id,
    level: step.level,
    label: labelOf(step.id, step.level),
    action: index === steps.length - 1 ? null : step.action,
  }));
}
