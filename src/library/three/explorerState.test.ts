import { INITIAL_EXPLORER_STATE, explorerBreadcrumb, explorerFocusId, explorerLevel, explorerReducer } from './explorerState';
import type { ExplorerState } from './explorerState';

const AREA: ExplorerState = { areaId: 'nk-23', equipmentId: null, sensorId: null };
const EQUIPMENT: ExplorerState = { areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: null };
const SENSOR: ExplorerState = { areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: 'pt-92531' };

describe(explorerReducer.name, () => {
  it('selects an area from the plant', () => {
    expect(explorerReducer(INITIAL_EXPLORER_STATE, { type: 'selectArea', areaId: 'nk-23' })).toEqual(AREA);
  });

  it('clears equipment and sensor when another area is selected', () => {
    expect(explorerReducer(SENSOR, { type: 'selectArea', areaId: 'nk-20' })).toEqual({ areaId: 'nk-20', equipmentId: null, sensorId: null });
  });

  it('selects equipment together with its area', () => {
    expect(explorerReducer(INITIAL_EXPLORER_STATE, { type: 'selectEquipment', areaId: 'nk-23', equipmentId: '23-ka-9101' })).toEqual(EQUIPMENT);
  });

  it('clears the sensor when other equipment is selected', () => {
    const next = explorerReducer(SENSOR, { type: 'selectEquipment', areaId: 'nk-23', equipmentId: '23-ka-9102' });

    expect(next).toEqual({ areaId: 'nk-23', equipmentId: '23-ka-9102', sensorId: null });
  });

  it('selects a sensor on the selected equipment', () => {
    expect(explorerReducer(EQUIPMENT, { type: 'selectSensor', sensorId: 'pt-92531' })).toEqual(SENSOR);
  });

  it('ignores a sensor when no equipment is selected', () => {
    expect(explorerReducer(AREA, { type: 'selectSensor', sensorId: 'pt-92531' })).toBe(AREA);
  });

  it('goes up one level at a time', () => {
    expect(explorerReducer(SENSOR, { type: 'up' })).toEqual(EQUIPMENT);
    expect(explorerReducer(EQUIPMENT, { type: 'up' })).toEqual(AREA);
    expect(explorerReducer(AREA, { type: 'up' })).toEqual(INITIAL_EXPLORER_STATE);
  });

  it('stays at the plant when going up from the top', () => {
    expect(explorerReducer(INITIAL_EXPLORER_STATE, { type: 'up' })).toBe(INITIAL_EXPLORER_STATE);
  });

  it('goes home from any depth', () => {
    expect(explorerReducer(SENSOR, { type: 'home' })).toEqual(INITIAL_EXPLORER_STATE);
  });
});

describe(explorerLevel.name, () => {
  it('names the deepest selected level', () => {
    expect(explorerLevel(INITIAL_EXPLORER_STATE)).toBe('plant');
    expect(explorerLevel(AREA)).toBe('area');
    expect(explorerLevel(EQUIPMENT)).toBe('equipment');
    expect(explorerLevel(SENSOR)).toBe('sensor');
  });
});

describe(explorerFocusId.name, () => {
  it('frames the plant, then the area, then the equipment', () => {
    expect(explorerFocusId(INITIAL_EXPLORER_STATE, 'nk')).toBe('nk');
    expect(explorerFocusId(AREA, 'nk')).toBe('nk-23');
    expect(explorerFocusId(EQUIPMENT, 'nk')).toBe('23-ka-9101');
  });

  it('keeps framing the equipment at sensor level', () => {
    expect(explorerFocusId(SENSOR, 'nk')).toBe('23-ka-9101');
  });
});

describe(explorerBreadcrumb.name, () => {
  const labelOf = (id: string) => id.toUpperCase();

  it('is just the plant at the top, with no action', () => {
    expect(explorerBreadcrumb(INITIAL_EXPLORER_STATE, 'nk', labelOf)).toEqual([{ id: 'nk', label: 'NK', level: 'plant', action: null }]);
  });

  it('lists every level down to the sensor', () => {
    const crumbs = explorerBreadcrumb(SENSOR, 'nk', labelOf);

    expect(crumbs.map((crumb) => crumb.level)).toEqual(['plant', 'area', 'equipment', 'sensor']);
    expect(crumbs.map((crumb) => crumb.label)).toEqual(['NK', 'NK-23', '23-KA-9101', 'PT-92531']);
  });

  it('gives every crumb but the last the action that returns to it', () => {
    const crumbs = explorerBreadcrumb(SENSOR, 'nk', labelOf);

    expect(crumbs[0].action).toEqual({ type: 'home' });
    expect(crumbs[1].action).toEqual({ type: 'selectArea', areaId: 'nk-23' });
    expect(crumbs[2].action).toEqual({ type: 'selectEquipment', areaId: 'nk-23', equipmentId: '23-ka-9101' });
    expect(crumbs[3].action).toBeNull();
  });

  it('returns to the right state when a crumb action is dispatched', () => {
    const crumbs = explorerBreadcrumb(SENSOR, 'nk', labelOf);
    const action = crumbs[1].action;

    expect(action && explorerReducer(SENSOR, action)).toEqual(AREA);
  });

  it('passes the level to the label function', () => {
    const spy = vi.fn(() => 'x');

    explorerBreadcrumb(AREA, 'nk', spy);

    expect(spy).toHaveBeenCalledWith('nk-23', 'area');
  });
});
