import { INITIAL_PLATFORM_STATE, isExploded, levelVisibility, platformDepth, platformReducer } from './platformState';
import type { PlatformState } from './platformState';

const ON_MAIN: PlatformState = { explode: 1, levelId: 'main', equipmentId: null };
const ON_SEPARATOR: PlatformState = { explode: 1, levelId: 'main', equipmentId: '20-va-2001' };

describe(platformReducer.name, () => {
  it('sets the explode amount, clamped to 0–1', () => {
    expect(platformReducer(INITIAL_PLATFORM_STATE, { type: 'setExplode', amount: 0.4 }).explode).toBe(0.4);
    expect(platformReducer(INITIAL_PLATFORM_STATE, { type: 'setExplode', amount: 3 }).explode).toBe(1);
  });

  it('returns the same state when the amount does not change', () => {
    expect(platformReducer(ON_MAIN, { type: 'setExplode', amount: 1 })).toBe(ON_MAIN);
  });

  it('toggles between assembled and fully exploded', () => {
    const exploded = platformReducer(INITIAL_PLATFORM_STATE, { type: 'toggleExplode' });
    expect(exploded.explode).toBe(1);
    expect(platformReducer(exploded, { type: 'toggleExplode' }).explode).toBe(0);
  });

  it('assembles from a mostly exploded stack and explodes from a mostly assembled one', () => {
    expect(platformReducer({ ...INITIAL_PLATFORM_STATE, explode: 0.7 }, { type: 'toggleExplode' }).explode).toBe(0);
    expect(platformReducer({ ...INITIAL_PLATFORM_STATE, explode: 0.3 }, { type: 'toggleExplode' }).explode).toBe(1);
  });

  it('isolates a level and keeps the explode amount', () => {
    expect(platformReducer({ ...INITIAL_PLATFORM_STATE, explode: 0.6 }, { type: 'isolate', levelId: 'cellar' })).toEqual({ explode: 0.6, levelId: 'cellar', equipmentId: null });
  });

  it('shows the whole platform when the isolated level is picked again', () => {
    expect(platformReducer(ON_MAIN, { type: 'isolate', levelId: 'main' }).levelId).toBeNull();
  });

  it('drops the equipment selection when another level is isolated', () => {
    expect(platformReducer(ON_SEPARATOR, { type: 'isolate', levelId: 'upper' })).toEqual({ explode: 1, levelId: 'upper', equipmentId: null });
  });

  it('selects equipment and isolates its level', () => {
    expect(platformReducer(INITIAL_PLATFORM_STATE, { type: 'selectEquipment', levelId: 'main', equipmentId: '20-va-2001' })).toEqual({ explode: 0, levelId: 'main', equipmentId: '20-va-2001' });
  });

  it('deselects equipment that is selected again', () => {
    expect(platformReducer(ON_SEPARATOR, { type: 'selectEquipment', levelId: 'main', equipmentId: '20-va-2001' })).toEqual(ON_MAIN);
  });

  it('clears the equipment and keeps the level', () => {
    expect(platformReducer(ON_SEPARATOR, { type: 'clearEquipment' })).toEqual(ON_MAIN);
    expect(platformReducer(ON_MAIN, { type: 'clearEquipment' })).toBe(ON_MAIN);
  });

  it('steps back from equipment to level to platform to assembled', () => {
    const level = platformReducer(ON_SEPARATOR, { type: 'up' });
    const platform = platformReducer(level, { type: 'up' });
    const assembled = platformReducer(platform, { type: 'up' });

    expect(level).toEqual(ON_MAIN);
    expect(platform).toEqual({ explode: 1, levelId: null, equipmentId: null });
    expect(assembled).toEqual(INITIAL_PLATFORM_STATE);
    expect(platformReducer(assembled, { type: 'up' })).toBe(assembled);
  });

  it('resets to the assembled platform', () => {
    expect(platformReducer(ON_SEPARATOR, { type: 'reset' })).toEqual(INITIAL_PLATFORM_STATE);
  });
});

describe(isExploded.name, () => {
  it('is true past the halfway point', () => {
    expect(isExploded({ ...INITIAL_PLATFORM_STATE, explode: 0.5 })).toBe(false);
    expect(isExploded({ ...INITIAL_PLATFORM_STATE, explode: 0.51 })).toBe(true);
  });
});

describe(platformDepth.name, () => {
  it('names the deepest selection', () => {
    expect(platformDepth(INITIAL_PLATFORM_STATE)).toBe('platform');
    expect(platformDepth(ON_MAIN)).toBe('level');
    expect(platformDepth(ON_SEPARATOR)).toBe('equipment');
  });
});

describe(levelVisibility.name, () => {
  it('draws every level solid when none is isolated', () => {
    expect(levelVisibility(INITIAL_PLATFORM_STATE, 'cellar')).toBe('solid');
  });

  it('ghosts every level but the isolated one', () => {
    expect(levelVisibility(ON_MAIN, 'main')).toBe('solid');
    expect(levelVisibility(ON_MAIN, 'cellar')).toBe('ghost');
  });
});
