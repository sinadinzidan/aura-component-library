import { lngLabelAnchor, lngUnitRingRadius, lngUnitSize, unitsCentre, unitsOfStage } from './lngSiteLogic';
import type { LngUnit } from './lngSiteLogic';

const TANK: LngUnit = { id: 'tank', kind: 'tank', tag: '61-TK-101', name: 'LNG tank', stageId: 'storage', position: [10, 0, 20], temperature: -162 };
const MCHE: LngUnit = { id: 'mche', kind: 'mche', tag: '40-HX-001', name: 'Main exchanger', stageId: 'liquefaction', position: [0, 0, 0], temperature: -150, height: 50 };
const FLARE: LngUnit = { id: 'flare', kind: 'flare', tag: '90-FL-001', name: 'Flare', stageId: null, position: [-30, 0, 0], temperature: null, height: 40 };

describe(lngUnitSize.name, () => {
  it('sizes a tank from its fixed dimensions', () => {
    expect(lngUnitSize(TANK)).toEqual([37, 22 + 34 * 0.18 + 2.5, 37]);
  });

  it('makes the exchanger as tall as asked plus its head room', () => {
    expect(lngUnitSize(MCHE)[1]).toBe(52);
  });

  it('grows a cooler bank with its bays', () => {
    const small = lngUnitSize({ ...TANK, kind: 'cooler-bank', count: 4 });
    const large = lngUnitSize({ ...TANK, kind: 'cooler-bank', count: 10 });

    expect(large[0]).toBeGreaterThan(small[0]);
  });

  it('uses a fixed size for compressors and buildings', () => {
    expect(lngUnitSize({ ...TANK, kind: 'compressor' })).toEqual([10, 3.8, 4]);
    expect(lngUnitSize({ ...TANK, kind: 'control-room' })).toEqual([12.5, 7.6, 8.5]);
  });

  it('covers every kind with a positive size', () => {
    const kinds = ['slug-catcher', 'separator', 'column', 'vessel', 'mche', 'compressor', 'turbine', 'cooler-bank', 'tank', 'loading-arms', 'carrier', 'flare', 'building', 'control-room'] as const;
    for (const kind of kinds) expect(lngUnitSize({ ...TANK, kind }).every((value) => value > 0)).toBe(true);
  });
});

describe(lngUnitRingRadius.name, () => {
  it('encloses the footprint', () => {
    const [x, , z] = lngUnitSize(TANK);

    expect(lngUnitRingRadius(TANK)).toBeGreaterThan(Math.hypot(x, z) / 2);
  });
});

describe(lngLabelAnchor.name, () => {
  it('sits above the unit top, over its centre', () => {
    const [x, y, z] = lngLabelAnchor(MCHE);

    expect([x, z]).toEqual([0, 0]);
    expect(y).toBeGreaterThan(52);
  });
});

describe('grouping units', () => {
  it('selects the units of one stage', () => {
    expect(unitsOfStage([TANK, MCHE, FLARE], 'storage')).toEqual([TANK]);
    expect(unitsOfStage([TANK, MCHE, FLARE], 'missing')).toEqual([]);
  });

  it('averages positions for a centre', () => {
    expect(unitsCentre([TANK, MCHE])).toEqual([5, 0, 10]);
    expect(unitsCentre([])).toEqual([0, 0, 0]);
  });
});
