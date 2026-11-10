import { findLevel, findPlatformEquipment, levelEnvelope, platformCameraTarget, toExplodeLevels } from './platformLayout';
import type { PlatformLayout } from './platformLayout';

const LAYOUT: PlatformLayout = {
  size: [40, 26],
  gap: 9,
  draught: 4,
  levels: [
    { id: 'jacket', name: 'Jacket', kind: 'jacket', elevation: 12, height: 12, equipment: [] },
    {
      id: 'cellar',
      name: 'Cellar deck',
      kind: 'deck',
      elevation: 12,
      height: 6,
      equipment: [{ id: '21-pa-2001', kind: 'pump', tag: '21-PA-2001', position: [-10, 0, 4] }],
    },
    {
      id: 'upper',
      name: 'Upper deck',
      kind: 'deck',
      elevation: 18,
      height: 0,
      equipment: [],
      features: [{ id: 'derrick', kind: 'derrick', position: [6, 0, 0] }],
    },
  ],
};

describe(levelEnvelope.name, () => {
  it('runs the jacket from below the waterline to its top', () => {
    const jacket = levelEnvelope(LAYOUT, LAYOUT.levels[0]);

    expect(jacket.min).toEqual([-20, -4, -13]);
    expect(jacket.max).toEqual([20, 12, 13]);
  });

  it('covers a deck from just under its plate to the deck above', () => {
    const cellar = levelEnvelope(LAYOUT, LAYOUT.levels[1]);

    expect(cellar.min[1]).toBeCloseTo(11.4);
    expect(cellar.max[1]).toBe(18);
  });

  it('grows to hold a tall feature', () => {
    const upper = levelEnvelope(LAYOUT, LAYOUT.levels[2]);

    expect(upper.max[1]).toBe(48);
  });
});

describe(toExplodeLevels.name, () => {
  it('keeps the level order and ids', () => {
    expect(toExplodeLevels(LAYOUT).map((level) => level.id)).toEqual(['jacket', 'cellar', 'upper']);
  });
});

describe(findLevel.name, () => {
  it('finds a level by id', () => {
    expect(findLevel(LAYOUT, 'cellar')?.name).toBe('Cellar deck');
    expect(findLevel(LAYOUT, 'bridge')).toBeUndefined();
  });
});

describe(findPlatformEquipment.name, () => {
  it('finds equipment and the level it stands on', () => {
    const found = findPlatformEquipment(LAYOUT, '21-pa-2001');

    expect(found?.level.id).toBe('cellar');
    expect(found?.equipment.tag).toBe('21-PA-2001');
  });

  it('returns null for an unknown id', () => {
    expect(findPlatformEquipment(LAYOUT, '99-xx-0000')).toBeNull();
  });
});

describe(platformCameraTarget.name, () => {
  it('looks at the middle of the assembled platform', () => {
    const target = platformCameraTarget(LAYOUT, { explode: 0 });

    expect(target.lookAt[1]).toBeCloseTo(22);
  });

  it('looks higher and stands further back when exploded', () => {
    const assembled = platformCameraTarget(LAYOUT, { explode: 0 });
    const exploded = platformCameraTarget(LAYOUT, { explode: 1 });

    expect(exploded.lookAt[1]).toBeGreaterThan(assembled.lookAt[1]);
    expect(exploded.position[2]).toBeGreaterThan(assembled.position[2]);
  });

  it('follows an isolated level to where it floats', () => {
    const assembled = platformCameraTarget(LAYOUT, { explode: 0, levelId: 'cellar' });
    const exploded = platformCameraTarget(LAYOUT, { explode: 1, levelId: 'cellar' });

    expect(exploded.lookAt[1] - assembled.lookAt[1]).toBeCloseTo(9);
  });

  it('stands closer to one level than to the whole platform', () => {
    const whole = platformCameraTarget(LAYOUT, { explode: 0 });
    const level = platformCameraTarget(LAYOUT, { explode: 0, levelId: 'cellar' });

    expect(level.position[2] - level.lookAt[2]).toBeLessThan(whole.position[2] - whole.lookAt[2]);
  });

  it('frames the whole platform for an unknown level', () => {
    expect(platformCameraTarget(LAYOUT, { explode: 0, levelId: 'bridge' })).toEqual(platformCameraTarget(LAYOUT, { explode: 0 }));
  });
});
